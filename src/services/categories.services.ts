import { createCategoryReqBody, updateCategoryReqBody } from "../models/requests/Category.request"
import databaseService from "./database.servies"
import Category from "../models/schema/Category.schema"
import { ObjectId } from "mongodb"

class CategoryServices {
  async getAllCategories() {
    const categories = await databaseService.categories.find().toArray()
    return categories
  }

  async createCategory({ payload }: { payload: createCategoryReqBody }) {
    const result = await databaseService.categories.insertOne(new Category(payload))
    const { insertedId } = result
    const category = await databaseService.categories.findOne({ _id: new ObjectId(insertedId) })
    return category
  }

  async updateCategory({ id, payload }: { id: string; payload: updateCategoryReqBody }) {
    const result = await databaseService.categories.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...payload
        },
        $currentDate: {
          updatedAt: true
        }
      },
      {
        returnDocument: "after"
      }
    )
    return result
  }
}

const categoryServices = new CategoryServices()
export default categoryServices
