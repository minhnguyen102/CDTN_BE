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
  const { page, limit } = paginationQueryParser(req, {
    defaultLimit: 10,
    allowLimits: [10, 20, 30]
  })
  const { categoryId } = req.params
  const result = await guestServices.getMenu({ categoryId, page, limit })

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.GET_MENU_SUCCESS,
    data: result
  })
}
