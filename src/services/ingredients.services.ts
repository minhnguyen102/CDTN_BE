import { createIngredientReqBody, updateIngredientReqBody } from "../models/requests/Ingredient.request"
import databaseService from "./database.servies"
import Ingredient from "../models/schema/Ingredient.schema"
import { ObjectId } from "mongodb"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { removeAccents } from "../utils/helpers"
import { CategoryTypeStatus, NotificationType } from "../constants/enums"
import { getIO } from "../utils/socket"

class IngredientServices {
  async createIngredient({ payload }: { payload: createIngredientReqBody }) {
    const { categoryId, ...rest } = payload
    const mongoIdCategory = new ObjectId(categoryId)

    const isValidCategory = await databaseService.categories.findOne({
      _id: mongoIdCategory
    })
    if (!isValidCategory) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.INGREDIENT_CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    if (payload.supplierIds) {
      const supplierObjectIds = payload.supplierIds.map((sid) => new ObjectId(sid))
      const foundSuppliers = await databaseService.suppliers
        .find({
          _id: { $in: supplierObjectIds }
        })
        .toArray()
      if (foundSuppliers.length !== supplierObjectIds.length) {
        throw new ErrorWithStatus({
          message: "Error supplier ID",
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }
    const name_search = removeAccents(payload.name)
    const result = await databaseService.ingredients.insertOne(
      new Ingredient({ ...rest, categoryId: mongoIdCategory, name_search })
    )
    const { insertedId } = result
    const ingredient = await databaseService.ingredients.findOne(
      { _id: new ObjectId(insertedId) },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0,
          name_search: 0,
          deleted: 0,
          deletedAt: 0
        }
      }
    )
    return ingredient
  }

  async getList({
    page,
    limit,
    search,
    categoryId,
    status,
    supplierId
  }: {
    page: number
    limit: number
    search?: string
    categoryId?: string
    status?: string
    supplierId?: string
  }) {
    const activeCategories = await databaseService.categories
      .find(
        { status: CategoryTypeStatus.ACTIVE },
        {
          projection: {
            _id: 1
          }
        }
      )
      .toArray()
    const activeCategoryIds = activeCategories.map((c) => c._id)

    // Cho phép lấy cả status là inactive
    const objectFind: any = {
      deleted: false
    }

    //Filter theo 'status' (Logic phái sinh)
    if (status === "low_stock") {
      // Tồn kho thấp: 0 < currentStock <= minStock
      objectFind.$expr = {
        $and: [{ $lte: ["$currentStock", "$minStock"] }, { $gt: ["$currentStock", 0] }]
      }
    } else if (status === "out_of_stock") {
      // Hết hàng: currentStock == 0
      objectFind.currentStock = 0
    } else if (status === "in_stock") {
      // Còn hàng (nhiều): currentStock > minStock
      objectFind.$expr = { $gt: ["$currentStock", "$minStock"] }
    }

    if (supplierId) {
      objectFind.supplierIds = { $in: [new ObjectId(supplierId)] }
    }

    //Filter theo 'categoryId'
    if (categoryId) {
      const isCategoryActive = activeCategoryIds.some((id) => id.toString() === categoryId)
      // const isCategoryActive = activeCategoryIds.include(categoryId)

      if (!isCategoryActive) {
        return {
          ingredients: [],
          pagination: { currentPage: page, limit, total: 0, totalPages: 0 }
        }
      }
      // Nếu active thì tìm chính xác theo ID đó
      objectFind.categoryId = new ObjectId(categoryId)
    } else {
      objectFind.categoryId = { $in: activeCategoryIds }
    }

    //Filter theo 'search' (Sử dụng Text Search)
    if (search) {
      objectFind.name_search = { $regex: removeAccents(search), $options: "i" }
    }

    // Xây dựng Aggregation Pipeline
    const aggregationPipeline: any[] = [{ $match: objectFind }]

    // Xây dựng Phân trang
    const skip = (page - 1) * limit
    aggregationPipeline.push({ $skip: skip })
    aggregationPipeline.push({ $limit: limit })

    // $lookup để "populate" category
    // (Tham chiếu sang collection 'ingredientCategories' để lấy tên)
    aggregationPipeline.push({
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryDetails"
      }
    })

    // $unwind để biến mảng 'categoryDetails' thành 1 object
    aggregationPipeline.push({
      $unwind: {
        path: "$categoryDetails",
        preserveNullAndEmptyArrays: true // Giữ lại ingredient dù không có category
      }
    })

    aggregationPipeline.push({
      $lookup: {
        from: "suppliers", // Tên collection trong DB
        localField: "supplierIds", // Trường mảng ID trong ingredients
        foreignField: "_id",
        as: "supplierDetails" // Tên biến tạm chứa thông tin chi tiết
      }
    })

    const projectStage: any = {
      $project: {
        // Lấy tên category từ trường tạm
        categoryName: "$categoryDetails.name",
        supplierNames: {
          $map: {
            input: "$supplierDetails",
            as: "supplier", // Biến tạm cho từng phần tử
            in: { _id: "$$supplier._id", name: "$$supplier.name" }
          }
        },
        name: 1,
        unit: 1,
        unitPrice: 1,
        currentStock: 1,
        minStock: 1
      }
    }

    aggregationPipeline.push(projectStage)

    const [ingredients, totalFilteredDocuments] = await Promise.all([
      databaseService.ingredients.aggregate(aggregationPipeline).toArray(),
      databaseService.ingredients.countDocuments(objectFind)
    ])
    const totalPages = Math.ceil(totalFilteredDocuments / limit)
    return {
      ingredients,
      pagination: {
        currentPage: page,
        limit: limit,
        total: totalFilteredDocuments,
        totalPages: totalPages
      }
    }
  }

  async update({ id, payload }: { id: string; payload: updateIngredientReqBody & { name_search?: string } }) {
    const ingredientId = new ObjectId(id)

    const ingredient = await databaseService.ingredients.findOne({
      _id: ingredientId
    })
    if (!ingredient) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.INGREDIENT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (payload.categoryId) {
      const isExistsCategory = await databaseService.categories.findOne({
        _id: new ObjectId(payload.categoryId)
      })
      if (!isExistsCategory) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.INGREDIENT_CATEGORY_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      payload.categoryId = new ObjectId(payload.categoryId)
    }

    if (payload.supplierIds) {
      const supplierObjectIds = payload.supplierIds.map((sid) => new ObjectId(sid))
      const foundSuppliers = await databaseService.suppliers
        .find({
          _id: { $in: supplierObjectIds }
        })
        .toArray()
      if (foundSuppliers.length !== supplierObjectIds.length) {
        throw new ErrorWithStatus({
          message: "Error supplier ID",
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      payload.supplierIds = supplierObjectIds
    }

    await databaseService.ingredients.updateOne(
      { _id: ingredientId },
      {
        $set: {
          ...payload
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )

    // Check and emit low stock alert after update
    if (payload.currentStock !== undefined || payload.minStock !== undefined) {
      await this.checkAndEmitLowStockAlert(id)
    }

    const [updatedIngredient] = await databaseService.ingredients
      .aggregate([
        { $match: { _id: ingredientId } },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "categoryDetail"
          }
        },
        {
          $unwind: {
            path: "$categoryDetail",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplierIds",
            foreignField: "_id",
            as: "supplierDetails"
          }
        },

        {
          $project: {
            // Lấy tên Category
            categoryName: "$categoryDetail.name",

            suppliers: {
              $map: {
                input: "$supplierDetails",
                as: "sup",
                in: { _id: "$$sup._id", name: "$$sup.name" }
              }
            },

            name: 1,
            unit: 1,
            minStock: 1,
            unitPrice: 1,
            currentStock: 1
          }
        }
      ])
      .toArray()
    return updatedIngredient
  }

  async checkAndEmitLowStockAlert(ingredientId: string) {
    const ingredient = await databaseService.ingredients.findOne({
      _id: new ObjectId(ingredientId),
      deleted: false
    })

    if (!ingredient) return

    // ALWAYS emit if stock is low - Frontend will handle deduplication
    if (ingredient.currentStock <= ingredient.minStock) {
      const io = getIO()
      const alertLevel = ingredient.currentStock === 0 ? "critical" : "low"
      const stockPercentage = ingredient.minStock > 0 
        ? Math.round((ingredient.currentStock / ingredient.minStock) * 100)
        : 0

      // Emit to chef_room - Frontend decides whether to show notification
      io.to("chef_room").emit("low_ingredient_alert", {
        notificationType: NotificationType.SYSTEM,
        ingredientId: ingredient._id.toString(),
        ingredientName: ingredient.name,
        currentStock: ingredient.currentStock,
        minStock: ingredient.minStock,
        unit: ingredient.unit,
        alertLevel, // "low" or "critical"
        stockPercentage,
        message: ingredient.currentStock === 0 
          ? `Nguyên liệu "${ingredient.name}" đã hết!`
          : `Nguyên liệu "${ingredient.name}" sắp hết (còn ${ingredient.currentStock}${ingredient.unit})`,
        timestamp: new Date()
      })

      console.log(`Low stock alert emitted for: ${ingredient.name} (currentStock: ${ingredient.currentStock})`)
    }
  }

  async delete({ id }: { id: string }) {
    const result = await databaseService.ingredients.updateOne(
      {
        _id: new ObjectId(id)
      },
      {
        $set: {
          deleted: true
        },
        $currentDate: {
          updatedAt: true,
          deletedAt: true
        }
      }
    )
    if (!result.modifiedCount) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.INGREDIENT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return true
  }
}

const ingredientServices = new IngredientServices()
export default ingredientServices
