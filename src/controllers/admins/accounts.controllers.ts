import { Request, Response } from "express"
import { RegisterReqBody } from "~/models/requests/Account.request"
import accountsServices from "~/services/accounts.services"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "~/constants/message"
import { ObjectId } from "mongodb"

export const loginController = async (req: Request, res: Response) => {
  const user_id = req.account?._id as ObjectId
  const result = await accountsServices.login(user_id?.toString())
  res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await accountsServices.register(req.body)
  res.json({
    message: "Register success",
    result
  })
}
