import { createCategoryReqBody } from "../models/requests/Category.request"
import databaseService from "./database.servies"
import Category from "../models/schema/Category.schema"
import { ObjectId } from "mongodb"

class CategoryServices {
  async createCategory({ payload }: { payload: createCategoryReqBody }) {
    const result = await databaseService.categories.insertOne(new Category(payload))
    const { insertedId } = result
    const category = await databaseService.categories.findOne({ _id: new ObjectId(insertedId) })
    return category
  }
}

const categoryServices = new CategoryServices()
export default categoryServices
