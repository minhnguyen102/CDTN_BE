import { Request, Response } from "express"
import {
  changePasswordReqBody,
  EmailVerifyTokenReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  resetPasswordReqBody,
  TokenPayload,
  updateAccountReqBody,
  updateMeReqBody
} from "../../models/requests/Account.request"
import accountsServices from "../../services/accounts.services"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { ObjectId } from "mongodb"
import databaseService from "../../services/database.servies"
import HTTP_STATUS from "../../constants/httpStatus"
import { AccountVerifyStatus } from "../../constants/enums"
import Account from "../../models/schema/Account.schema"
import { pick } from "lodash"
import { paginationQueryParser } from "../../utils/helpers"

export const loginController = async (req: Request, res: Response) => {
  const result = await accountsServices.login({ account: req.account as Account })
  res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const payload = pick(req.body, ["name", "email", "phone", "confirm_password", "date_of_birth", "role_id"])
  const result = await accountsServices.register({ payload })
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
  const { user_id, verify } = req.decoded_refresh_token as TokenPayload
  const result = await accountsServices.refreshToken({ refresh_token, user_id, verify })
  res.json({
    message: USER_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, EmailVerifyTokenReqBody>,
  res: Response
) => {
  const { user_id, verify } = req.decoded_email_verify_token as TokenPayload
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
  if (account.email_verify_token === "" && account.verify === AccountVerifyStatus.VERIFIED) {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  const { email } = account
  const result = await accountsServices.verifyEmail({ user_id, verify, email })
  res.json({
    message: USER_MESSAGES.VERIFY_EMAIL_SUCCESS,
    result
  })
}

export const resendEmailVerifyController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id, verify } = req.decoded_email_verify_token as TokenPayload
  // const { user_id, verify } = req.decoded_access_token as TokenPayload
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
  if (account.verify === AccountVerifyStatus.VERIFIED) {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  const { email } = account
  await accountsServices.resendEmailVerify({ user_id, verify, email })
  res.json({
    message: USER_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
  })
}

export const forgotPasswordController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { _id, verify, email } = req.account as Account
  await accountsServices.forgotPassword({ user_id: (_id as ObjectId).toString(), verify, email })
  res.json({
    message: USER_MESSAGES.FORGOT_PASSWORD_INSTRUCTIONS_SENT
  })
}

export const verifyForgotPasswordTokenController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  res.json({
    message: USER_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordTokenController = async (
  req: Request<ParamsDictionary, any, resetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  await accountsServices.resetPassword({ user_id, new_password: password })
  res.json({
    message: USER_MESSAGES.RESET_PASSWORD_SUCCESS
  })
}

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const result = await accountsServices.getMe({ user_id })
  res.json({
    message: USER_MESSAGES.GET_MY_PROFILE_SUCCESS,
    result
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, updateMeReqBody>, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const payload = pick(req.body, ["name", "date_of_birth", "phone"]) // Chỉ cho upadate những key này, tránh bị phá bởi Postman
  const result = await accountsServices.updateMe({ user_id, payload: payload })
  res.json({
    message: USER_MESSAGES.UPDATE_INFOR_SUCCESS,
    result
  })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, changePasswordReqBody>,
  res: Response
) => {
  const { old_password, password } = req.body
  const { user_id } = req.decoded_access_token as TokenPayload
  await accountsServices.changePassword({ user_id, old_password, new_password: password })
  res.json({
    message: USER_MESSAGES.CHANGE_PASSWORD_SUCCESS
  })
}

export const getAccountsController = async (req: Request, res: Response) => {
  // 1. Lấy page và limit từ helper
  const { page, limit } = paginationQueryParser(req, {
    defaultLimit: 10,
    allowLimits: [5, 10, 15, 20]
  })

  // 2. Lấy các tham số filter/search
  const search = (req.query.search as string) || undefined
  const roleId = (req.query.roleId as string) || undefined
  const status = (req.query.status as string) || undefined // 'Active', 'Inactive'

  // 3. Gọi Service
  const result = await accountsServices.getList({
    page,
    limit,
    search,
    roleId,
    status
  })

  // 5. Trả về response
  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.ACCOUNTS_FETCHED_SUCCESSFULLY,
    result
  })
}

export const updateAvatarController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const file = req.file
  // console.log("file: ", file)
  if (!file) {
    return res.status(400).json({
      message: USER_MESSAGES.NO_IMAGE_UPLOADED
    })
  }
  const result = await accountsServices.updateAvatar({ user_id, file })

  // console.log(result)
  res.json({
    message: USER_MESSAGES.UPDATE_AVATAR_SUCCESS,
    result
  })
}

export const updateAccountController = async (
  req: Request<ParamsDictionary, any, updateAccountReqBody>,
  res: Response
) => {
  const { id } = req.params
  const payload = req.body
  await accountsServices.updateAccount({ accountId: id, payload })

  return res.json({
    message: USER_MESSAGES.UPDATE_ACCOUNT_SUCCESS
  })
}
