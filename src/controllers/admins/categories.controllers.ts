import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { createCategoryReqBody } from "../../models/requests/Category.request"
import categoryServices from "../../services/categories.services"
import USER_MESSAGES from "../../constants/message"

export const createCategoryController = async (
  req: Request<ParamsDictionary, any, createCategoryReqBody>,
  res: Response
) => {
  const payload = req.body
  const result = await categoryServices.createCategory({ payload })
  res.json({
    message: USER_MESSAGES.CREATE_CATEGORY_SUCCESS,
    result
  })
}
