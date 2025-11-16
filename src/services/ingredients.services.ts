import { createIngredientReqBody } from "../models/requests/Ingredient.request"
import databaseService from "./database.servies"
import Ingredient from "../models/schema/Ingredient.schema"
import { ObjectId } from "mongodb"

class IngredientServices {
  async createIngredient({ payload }: { payload: createIngredientReqBody }) {
    const result = await databaseService.ingredients.insertOne(new Ingredient(payload))
    const { insertedId } = result
    const ingredient = await databaseService.ingredients.findOne(
      { _id: new ObjectId(insertedId) },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0
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
    if (status === "Low Stock") {
      // Tồn kho thấp: 0 < currentStock <= minStock
      objectFind.$expr = {
        $and: [{ $lte: ["$currentStock", "$minStock"] }, { $gt: ["$currentStock", 0] }]
      }
    } else if (status === "Out of Stock") {
      // Hết hàng: currentStock == 0
      objectFind.currentStock = 0
    } else if (status === "In Stock") {
      // Còn hàng (nhiều): currentStock > minStock
      objectFind.$expr = { $gt: ["$currentStock", "$minStock"] }
    }

    //Filter theo 'categoryId'
    if (categoryId) {
      objectFind.categoryId = new ObjectId(categoryId)
    }

    //Filter theo 'search' (Sử dụng Text Search)
    if (search) {
      objectFind.$text = { $search: search }
    }

    // Xây dựng Aggregation Pipeline
    const aggregationPipeline: any[] = [
      // Giai đoạn 1: Lọc/Tìm kiếm
      // Sử dụng $match với các điều kiện đã lọc ở trên
      { $match: objectFind }
    ]

    // Xây dựng Sắp xếp
    let sortStage: any = { $sort: { createdAt: -1 } } // Sắp xếp mặc định
    if (search) {
      // Nếu có tìm kiếm, sắp xếp theo độ liên quan
      sortStage = { $sort: { score: { $meta: "textScore" } } }
    }
    aggregationPipeline.push(sortStage)

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

    // $project để định hình output cuối cùng
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

    if (search) {
      projectStage.$project.score = { $meta: "textScore" }
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
