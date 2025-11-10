import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import { createIngredientReqBody } from "../../models/requests/Ingredient.request"
import ingredientServices from "../../services/ingredients.services"

export const createIngredientController = async (
  req: Request<ParamsDictionary, any, createIngredientReqBody>,
  res: Response
) => {
  const payload = req.body
  const result = await ingredientServices.createIngredient({ payload })
  res.json({
    message: USER_MESSAGES.INGREDIENT_CREATED_SUCCESSFULLY,
    result
  })
}
