import databaseService from "./database.servies"
import { ObjectId } from "mongodb"
import { CreateDishCategoryReqBody } from "../models/requests/DishCategory.requests"
import DishCategory from "../models/schema/DishCategory.schema"

class DishCategoryService {
  async create({ payload }: { payload: CreateDishCategoryReqBody & { image: string } }) {
    const newCategory = await databaseService.dish_categories.insertOne(new DishCategory(payload))
    const result = await databaseService.dish_categories.findOne(
      {
        _id: newCategory.insertedId
      },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0
        }
      }
    )
    return result
  }
}

const dishCategoryService = new DishCategoryService()
export default dishCategoryService
