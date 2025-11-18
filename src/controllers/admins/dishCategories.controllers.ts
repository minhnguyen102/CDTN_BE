import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import HTTP_STATUS from "../../constants/httpStatus"
import dishCategoryService from "../../services/dishCategories.services"

export const createDishCategoryController = async (req: Request, res: Response) => {
  const result = await dishCategoryService.create(req.body)

  return res.status(HTTP_STATUS.CREATED).json({
    message: USER_MESSAGES.CATEGORY_CREATED_SUCCESSFULLY,
    data: result
  })
}
