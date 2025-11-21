import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import HTTP_STATUS from "../../constants/httpStatus"
import dishCategoryService from "../../services/dishCategories.services"
import { CreateDishCategoryReqBody, UpdateDishCategoryReqBody } from "../../models/requests/DishCategory.requests"
import { paginationQueryParser } from "../../utils/helpers"

export const createDishCategoryController = async (
  req: Request<ParamsDictionary, any, CreateDishCategoryReqBody>,
  res: Response
) => {
  const _payload = pick(req.body, ["name", "display_order", "status", "description"])
  const image = req.file?.path as string
  const image_id = req.file?.filename as string
  const payload = { ..._payload, image, image_id }
  const result = await dishCategoryService.create({ payload })

  return res.status(HTTP_STATUS.CREATED).json({
    message: USER_MESSAGES.CATEGORY_CREATED_SUCCESSFULLY,
    data: result
  })
}

export const getDishCategoriesController = async (req: Request, res: Response) => {
  const { page, limit } = paginationQueryParser(req, { defaultLimit: 5, allowLimits: [5, 10, 15] })
  const search = (req.query.search as string) || undefined
  const status = (req.query.status as string) || undefined

  const result = await dishCategoryService.getList({
    page,
    limit,
    search,
    status
  })

  return res.json({
    message: USER_MESSAGES.CATEGORY_LIST_SUCCESS,
    result
  })
}

export const updateDishCategoryController = async (
  req: Request<ParamsDictionary, any, UpdateDishCategoryReqBody>,
  res: Response
) => {
  const { id } = req.params
  const payload = pick(req.body, ["name", "display_order", "status", "description", "image"])
  if (req.file) {
    payload.image = req.file.path as string
  }
  const result = await dishCategoryService.update({ id, payload })

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.CATEGORY_UPDATED_SUCCESSFULLY,
    data: result
  })
}
