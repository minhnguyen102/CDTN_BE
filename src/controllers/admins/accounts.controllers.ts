import { Request, Response } from "express"
import { LogoutReqBody, RefreshTokenReqBody, RegisterReqBody, TokenPayload } from "~/models/requests/Account.request"
import accountsServices from "~/services/accounts.services"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "~/constants/message"
import { ObjectId } from "mongodb"

export const loginController = async (req: Request, res: Response) => {
  // throw new Error("Loi o day")
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

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  await accountsServices.logout(refresh_token)
  res.json({
    message: USER_MESSAGES.LOGOUT_SUCCESS
  })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body
  const { user_id } = req.decoded_refresh_token as TokenPayload
  const result = await accountsServices.refreshToken({ refresh_token, user_id })
  res.json({
    message: USER_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}
