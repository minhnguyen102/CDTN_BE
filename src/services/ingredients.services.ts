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
}

const ingredientServices = new IngredientServices()
export default ingredientServices
