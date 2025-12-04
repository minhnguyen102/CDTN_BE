import { Request, Response } from "express"
import HTTP_STATUS from "../../constants/httpStatus"
import guestServices from "../../services/guests.services"

export const getGuestMenuController = async (req: Request, res: Response) => {
  const result = await guestServices.getMenu()

  return res.status(HTTP_STATUS.OK).json({
    message: "Get menu successfully",
    data: result
  })
}
