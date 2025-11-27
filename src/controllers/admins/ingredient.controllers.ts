import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import { createIngredientReqBody, updateIngredientReqBody } from "../../models/requests/Ingredient.request"
import ingredientServices from "../../services/ingredients.services"
import { paginationQueryParser } from "../../utils/helpers"
import HTTP_STATUS from "../../constants/httpStatus"

export const createIngredientController = async (
  req: Request<ParamsDictionary, any, createIngredientReqBody>,
  res: Response
) => {
  const payload = pick(req.body, ["name", "categoryId", "unit", "minStock", "supplierIds"])
  const result = await ingredientServices.createIngredient({ payload })
  res.json({
    message: USER_MESSAGES.INGREDIENT_CREATED_SUCCESSFULLY,
    result
  })
}

export const listIngredientsController = async (req: Request, res: Response) => {
  const { page, limit } = paginationQueryParser(req, {
    defaultLimit: 10,
    allowLimits: [10, 15, 20]
  })

  const supplierId = (req.query.supplierId as string) || undefined

  // Lấy các tham số filter và search
  const search = (req.query.search as string) || undefined // search theo name
  const categoryId = (req.query.categoryId as string) || undefined

  // 'status' là một trường ảo (In Stock, Low Stock, Out of Stock)
  const status = (req.query.status as string) || undefined

  // Gọi service để lấy dữ liệu
  const result = await ingredientServices.getList({
    page,
    limit,
    search,
    categoryId,
    status,
    supplierId
  })

  // 5. Trả về kết quả
  return res.json({
    message: USER_MESSAGES.INGREDIENTS_FETCHED_SUCCESSFULLY,
    result
  })
}

export const updateIngredientController = async (
  req: Request<ParamsDictionary, any, updateIngredientReqBody>,
  res: Response
) => {
  const { id } = req.params
  const payload = pick(req.body, ["name", "categoryId", "unit", "minStock", "supplierIds"])
  const result = await ingredientServices.update({ id, payload })

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.INGREDIENT_UPDATED_SUCCESSFULLY, // "Ingredient updated successfully"
    data: result
  })
}
