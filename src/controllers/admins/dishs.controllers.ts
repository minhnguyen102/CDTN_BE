import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import HTTP_STATUS from "../../constants/httpStatus"
import USER_MESSAGES from "../../constants/message"
import { CreateDishReqBody, UpdateDishReqBody } from "../../models/requests/Dish.request"
import dishsService from "../../services/dishs.services"
import { paginationQueryParser } from "../../utils/helpers"

export const createDishController = async (req: Request<ParamsDictionary, any, CreateDishReqBody>, res: Response) => {
  // Xử lí image
  const image = req.file?.path
  const image_id = req.file?.filename

  const payload = req.body

  // Xử lý dữ liệu form-data (Chuẩn hóa dữ liệu)
  let recipe = []
  if (typeof payload.recipe === "string") {
    try {
      recipe = JSON.parse(payload.recipe)
    } catch (error) {
      recipe = []
    }
  } else {
    recipe = payload.recipe
  }

  const dishData = {
    name: payload.name,
    description: payload.description,
    price: Number(payload.price),
    status: payload.status,
    categoryId: payload.categoryId,
    recipe: recipe,
    image: image as string,
    image_id: image_id as string
  }

  const result = await dishsService.create(dishData)

  return res.status(HTTP_STATUS.CREATED).json({
    message: USER_MESSAGES.DISH_CREATED_SUCCESSFULLY,
    data: result
  })
}

export const getListDishController = async (req: Request, res: Response) => {
  const { page, limit } = paginationQueryParser(req, {
    defaultLimit: 10,
    allowLimits: [10, 20, 30]
  })

  const search = (req.query.search as string) || undefined
  const status = (req.query.status as string) || undefined
  const categoryId = (req.query.categoryId as string) || undefined

  let isFeatured: boolean | undefined = undefined
  if (req.query.isFeatured === "true") isFeatured = true
  if (req.query.isFeatured === "false") isFeatured = false

  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined

  const result = await dishsService.getList({
    page,
    limit,
    search,
    status,
    categoryId,
    isFeatured,
    minPrice,
    maxPrice
  })

  return res.status(HTTP_STATUS.OK).json({
    message: "Get list dishes successfully",
    data: result
  })
}

export const updateDishController = async (req: Request<ParamsDictionary, any, UpdateDishReqBody>, res: Response) => {
  const { id } = req.params

  const image = req.file?.path
  const image_id = req.file?.filename

  const payload = req.body

  let recipe = undefined
  if (payload.recipe) {
    if (typeof payload.recipe === "string") {
      try {
        recipe = JSON.parse(payload.recipe)
      } catch (e) {
        recipe = []
      }
    } else {
      recipe = payload.recipe
    }
  }

  const updateData: UpdateDishReqBody = {
    ...payload,
    price: payload.price ? Number(payload.price) : undefined,
    ...(recipe && { recipe }),
    ...(image && { image, image_id })
  }

  const result = await dishsService.update({ id, payload: updateData })

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.DISH_UPDATED_SUCCESSFULLY,
    data: result
  })
}
