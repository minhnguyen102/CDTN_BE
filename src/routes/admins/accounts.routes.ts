import { Router } from "express"
import {
  changePasswordController,
  emailVerifyController,
  forgotPasswordController,
  getAccountsController,
  getMeController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordTokenController,
  updateAccountController,
  updateAvatarController,
  updateMeController,
  verifyForgotPasswordTokenController
} from "../../controllers/admins/accounts.controllers"
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
  updateMeValidation,
  changePasswordValidation,
  updateAccountValidation,
  resendEmailVerifyTokenValidation
} from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { uploadCloud } from "../../utils/cloudinary"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
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
 * Body: { name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
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
 * Body: {email_verify_token: string}
 */
accountRoutes.post(
  "/resend-verify-email",
  resendEmailVerifyTokenValidation,
  wrapHandlerFunction(resendEmailVerifyController)
)

/**
 * Description: forgot-password
 * PATH: admin/accounts/forgot-password
 * Body: { email: string}
 */
accountRoutes.post("/forgot-password", forgotPasswordRequestValidation, wrapHandlerFunction(forgotPasswordController))

/**
 * Description: verify forgot-password-token
 * PATH: admin/accounts/verify-forgot-password
 * Body: { forgot-password-token: string}
 */
accountRoutes.post(
  "/verify-forgot-password",
  forgotPasswordTokenValidation,
  wrapHandlerFunction(verifyForgotPasswordTokenController)
)

/**
 * Description: reset password
 * PATH: admin/accounts/reset-password
 * Body: { password: string, confirm_password: string, forgot_password_token: string}
 */
accountRoutes.post(
  "/reset-password",
  resetPasswordValidation,
  forgotPasswordTokenValidation,
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

/**
 * Description: Change password
 * PATH: admin/accounts/change-password
 * Headers: {Authorization: Bearer access_token}
 */
accountRoutes.patch(
  "/change-password",
  accessTokenValidation,
  verifiedUserValidation,
  changePasswordValidation,
  wrapHandlerFunction(changePasswordController)
)

/**
 * Description: Get list of accounts (users/employees)
 * Path: /admin/accounts
 * Method: GET
 * Query: ?page=1&limit=10&search=Hieu&roleId=...&status=Active
 * Headers: { Authorization: Bearer <access_token> }
 */
accountRoutes.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_accounts"),
  wrapHandlerFunction(getAccountsController)
)

/**
 * Description: Update User Avatar
 * Path: /me/avatar
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: form-data { image: File }
 */
accountRoutes.patch(
  "/me/avatar",
  accessTokenValidation,
  verifiedUserValidation,
  uploadCloud.single("image"),
  wrapHandlerFunction(updateAvatarController)
)

/**
 * Description: Update info account (by admin)
 * Path: /account/:account_id
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: {status?: AccountStatus, role_id?: ObjectId}
 */
accountRoutes.patch(
  "/:id",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("update_account"),
  updateAccountValidation,
  wrapHandlerFunction(updateAccountController)
)

export default accountRoutes
