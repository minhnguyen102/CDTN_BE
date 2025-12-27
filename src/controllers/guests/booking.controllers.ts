import { Request, Response } from "express"
import HTTP_STATUS from "../../constants/httpStatus"
import guestServices from "../../services/guests.services"
import USER_MESSAGES from "../../constants/message"
import { ParamsDictionary } from "express-serve-static-core"

import { CreateBookingReqBody } from "../../models/requests/Guest.request"

export const createBookingController = async (
  req: Request<ParamsDictionary, any, CreateBookingReqBody>,
  res: Response
) => {
  const result = await guestServices.createBooking(req.body)
  res.json({
    message: "Gửi yêu cầu đặt bàn thành công! Nhà hàng sẽ liên hệ xác nhận sớm nhất.",
    data: result
  })
}
