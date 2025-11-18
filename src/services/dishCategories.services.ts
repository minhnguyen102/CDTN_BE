import databaseService from "./database.servies"
import { ObjectId } from "mongodb"
import { CreateDishCategoryReqBody } from "../models/requests/DishCategory.requests"

class DishCategoryService {
  async create(payload: CreateDishCategoryReqBody) {
    const newCategory = {
      _id: new ObjectId(),
      name: payload.name,
      description: payload.description || "",
      status: payload.status || "active", // Mặc định là active
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // await databaseService.dish_categories.insertOne(newCategory)
    return newCategory
  }
}

const dishCategoryService = new DishCategoryService()
export default dishCategoryService
