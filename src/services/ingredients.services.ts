import { createIngredientReqBody } from "../models/requests/Ingredient.request"
import databaseService from "./database.servies"
import Ingredient from "../models/schema/Ingredient.schema"
import { ObjectId } from "mongodb"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { removeAccents } from "../utils/helpers"

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
          name_search: 0
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
    status
  }: {
    page: number
    limit: number
    search?: string
    categoryId?: string
    status?: string
  }) {
    const objectFind: any = {}

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

    //Filter theo 'categoryId'
    if (categoryId) {
      objectFind.categoryId = new ObjectId(categoryId)
    }

    //Filter theo 'search' (Sử dụng Text Search)
    if (search) {
      objectFind.name_search = { $regex: search, $options: "i" }
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

    const projectStage: any = {
      $project: {
        // Lấy tên category từ trường tạm
        categoryName: "$categoryDetails.name",

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
}

const ingredientServices = new IngredientServices()
export default ingredientServices
