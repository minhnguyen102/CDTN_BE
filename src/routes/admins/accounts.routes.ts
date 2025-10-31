import { Router } from "express"
import {
  emailVerifyController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordTokenController,
  updateMeController,
  verifyForgotPasswordTokenController
} from "~/controllers/admins/accounts.controllers"
import {
  accessTokenValidation,
  emailVerifyTokenValidation,
  forgotPasswordTokenValidation,
  loginValidation,
  refreshTokenValidation,
  registerValidation,
  forgotPasswordRequestValidation,
  resetPasswordValidation,
  verifiedUserValidation,
  updateMeValidation
} from "~/middlewares/admins/validation.middlewares"
import { wrapHandlerFunction } from "~/utils/wrapHandler"
const accountRoutes = Router()

/**
 * Description: Login
 * PATH: admin/accounts/register
 * Method: POST
 * Body: { email: string, password: string }
 */
accountRoutes.post("/login", loginValidation, wrapHandlerFunction(loginController))

/**
 * Description: Register a new user
 * PATH: admin/accounts/register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601, role: RoleAccount}
 */
accountRoutes.post("/register", registerValidation, wrapHandlerFunction(registerController))

/**
 * Description: Logout
 * PATH: admin/accounts/logout
 * Body: { refresh_token: string}
 * Headers: {Authorization: Bearer access_token}
 */
accountRoutes.post("/logout", accessTokenValidation, refreshTokenValidation, wrapHandlerFunction(logoutController))

/**
 * Description: Refresh Token
 * PATH: admin/accounts/refresh-token
 * Body: { refresh_token: string}
 */
accountRoutes.post("/refresh-token", refreshTokenValidation, wrapHandlerFunction(refreshTokenController))

/**
 * Description: verify-email
 * PATH: admin/accounts/verify-email
 * Body: { email_verify_token: string }
 */
accountRoutes.post("/verify-email", emailVerifyTokenValidation, wrapHandlerFunction(emailVerifyController))

/**
 * Description: resend-verify-email
 * Yêu cầu phải đăng nhập mới được resend
 * PATH: admin/accounts/resend-verify-email
 * Body: {}
 * Headers: {Authorization: Bearer access_token}
 */
accountRoutes.post("/resend-verify-email", accessTokenValidation, wrapHandlerFunction(resendEmailVerifyController))

/**
 * Description: forgot-password
 * PATH: admin/accounts/forgot-password
 * Body: { email: string}
 */
accountRoutes.post(
  "/forgot-password",
  forgotPasswordRequestValidation, // kiểm tra email gửi lên có hợp lệ và trong hệ thống không
  wrapHandlerFunction(forgotPasswordController)
)

/**
 * Description: verify forgot-password-token
 * PATH: admin/accounts/verify-forgot-password
 * Body: { forgot-password-token: string}
 */
accountRoutes.post(
  "/verify-forgot-password",
  forgotPasswordTokenValidation, // kiểm tra forgot_password_token có hợp lệ và còn hạn không
  wrapHandlerFunction(verifyForgotPasswordTokenController)
)

/**
 * Description: reset password
 * PATH: admin/accounts/reset-password
 * Body: { password: string, confirm_password: string, forgot_password_token: string}
 */
accountRoutes.post(
  "/reset-password",
  resetPasswordValidation, // validate (password and confirm_password)
  forgotPasswordTokenValidation, // kiểm tra forgot_password_token có hợp lệ và còn hạn không
  wrapHandlerFunction(resetPasswordTokenController)
)

/**
 * Description: Get my profile
 * PATH: admin/accounts/me
 * Headers: {Authorization: Bearer access_token}
 */
accountRoutes.get("/me", accessTokenValidation, wrapHandlerFunction(getMeController))

/**
 * Description: update my profile
 * Cần xác định xem user đã verify email hay chưa => Thêm trường verify vào payload mỗi khi sign token
 * PATH: admin/accounts/me
 * Headers: {Authorization: Bearer access_token}
 */
accountRoutes.patch(
  "/me",
  accessTokenValidation,
  verifiedUserValidation,
  updateMeValidation,
  wrapHandlerFunction(updateMeController)
)

export default accountRoutes
