import { Request, Response } from "express"
import HTTP_STATUS from "../../constants/httpStatus"
import guestServices from "../../services/guests.services"
import USER_MESSAGES from "../../constants/message"
import { paginationQueryParser } from "../../utils/helpers"

export const getDishCategories = async (req: Request, res: Response) => {
  const result = await guestServices.getDishCategories()

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.GET_DISH_CATEGORIES_SUCCESS,
    data: result
  })
}

export const getGuestMenuController = async (req: Request, res: Response) => {
  const rating = Number(req.query.rating)
  const isFeatured = Boolean(req.query.isFeatured)
  const { page, limit } = paginationQueryParser(req, {
    defaultLimit: 10,
    allowLimits: [10, 20, 30]
  })
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined
  const { categoryId } = req.params
  const result = await guestServices.getMenu({ categoryId, page, limit, rating, isFeatured, maxPrice, minPrice })

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.GET_MENU_SUCCESS,
    data: result
  })
}
