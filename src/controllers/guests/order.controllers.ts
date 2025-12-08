import { Request, Response } from "express"
import HTTP_STATUS from "../../constants/httpStatus"
import { JwtPayload } from "jsonwebtoken"
import guestServices from "../../services/guests.services"
import { ParamsDictionary } from "express-serve-static-core"
import { CreateOrderReqBody } from "../../models/requests/Order.request"
import USER_MESSAGES from "../../constants/message"

export const createOrderController = async (req: Request<ParamsDictionary, any, CreateOrderReqBody>, res: Response) => {
  // Lấy thông tin từ Middleware decode
  const { user_id, guestName } = req.decoded_access_token as JwtPayload // userId ở đây là TableId
  // console.log(userId, guestName)
  const result = await guestServices.createOrder({
    tableId: user_id,
    guestName: guestName,
    items: req.body.items
  })

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.CREATE_ORDER_SUCCESS,
    data: result
  })
}
