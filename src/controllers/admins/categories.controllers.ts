import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { createCategoryReqBody, updateCategoryReqBody } from "../../models/requests/Category.request"
import categoryServices from "../../services/categories.services"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import { paginationQueryParser } from "../../utils/helpers"

export const getAllCategoryController = async (req: Request, res: Response) => {
  // pagination
  const { page, limit } = paginationQueryParser(req, { defaultLimit: 5, allowLimits: [5, 10, 15] })
  // Xử lí status
  const status = (req.query.status as string) || undefined
  // Xử lí search
  const search = (req.query.search as string) || undefined
  const result = await categoryServices.getAllCategories({ page, limit, status, search })
  res.json({
    message: USER_MESSAGES.GET_ALL_CATEGORY_SUCCESS,
    result
  })
}

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

export const updateCategoryController = async (
  req: Request<ParamsDictionary, any, updateCategoryReqBody>,
  res: Response
) => {
  const { id } = req.params
  const payload = pick(req.body, ["name", "description", "status"])
  const result = await categoryServices.updateCategory({ id, payload })
  res.json({
    message: USER_MESSAGES.UPDATE_CATEGORY_SUCCESS,
    result
  })
}
