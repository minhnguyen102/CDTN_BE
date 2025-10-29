import { Router } from "express"
import {
  loginController,
  logoutController,
  refreshTokenController,
  registerController
} from "~/controllers/admins/accounts.controllers"
import {
  accessTokenValidation,
  emailVerifyTokenValidation,
  loginValidation,
  refreshTokenValidation,
  registerValidation
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
 * Description: Logout
 * PATH: admin/accounts/refresh-token
 * Body: { refresh_token: string}
 */
accountRoutes.post("/refresh-token", refreshTokenValidation, wrapHandlerFunction(refreshTokenController))

/**
 * Description: verify-email
 * PATH: admin/accounts/verify-email
 * Body: { email_verify_token: string}
 */
accountRoutes.post("/verify-email", emailVerifyTokenValidation, (req, res) => {
  res.json({
    message: "OK"
  })
})

export default accountRoutes
