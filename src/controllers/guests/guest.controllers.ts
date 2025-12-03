import { Request, Response } from "express"
import HTTP_STATUS from "../../constants/httpStatus"
import guestServices from "../../services/guests.services"
import { ParamsDictionary } from "express-serve-static-core"
import { GuestLoginReqBody } from "../../models/requests/Guest.request"

export const guestLoginController = async (req: Request<ParamsDictionary, any, GuestLoginReqBody>, res: Response) => {
  const { guestName, qrToken } = req.body

  const result = await guestServices.login({ qrToken, guestName })

  return res.status(HTTP_STATUS.OK).json({
    message: "Login success",
    data: result
  })
}
