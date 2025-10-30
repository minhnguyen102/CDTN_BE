import { Request, Response } from "express"
import {
  EmailVerifyTokenReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  TokenPayload
} from "~/models/requests/Account.request"
import accountsServices from "~/services/accounts.services"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "~/constants/message"
import { ObjectId } from "mongodb"
import databaseService from "~/services/database.servies"
import HTTP_STATUS from "~/constants/httpStatus"
import { AccountVerifyStatus } from "~/constants/enums"

export const loginController = async (req: Request, res: Response) => {
  // throw new Error("Loi o day")
  const user_id = req.account?._id as ObjectId
  const result = await accountsServices.login({ user_id: user_id?.toString() })
  res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await accountsServices.register(req.body)
  res.json({
    message: USER_MESSAGES.REGISTER_SUCCESS_PENDING_VERIFICATION,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  await accountsServices.logout({ refresh_token })
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

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, EmailVerifyTokenReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const account = await databaseService.accounts.findOne({
    _id: new ObjectId(user_id)
  })
  // Nếu không tìm thấy account
  if (!account) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.USER_NOT_FOUND
    })
  }
  // Nếu đã verify email trước đó
  if (account.email_verify_token === "" && account.verify === AccountVerifyStatus.Verified) {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  const result = await accountsServices.verifyEmail({ user_id })
  res.json({
    message: USER_MESSAGES.VERIFY_EMAIL_SUCCESS,
    result
  })
}

export const resendEmailVerifyController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const account = await databaseService.accounts.findOne({
    _id: new ObjectId(user_id)
  })
  // Nếu không tìm thấy account
  if (!account) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.USER_NOT_FOUND
    })
  }
  // Nếu đã verify email trước đó
  if (account.verify === AccountVerifyStatus.Verified) {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  await accountsServices.resendEmailVerify({ user_id })
  res.json({
    message: USER_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
  })
}
