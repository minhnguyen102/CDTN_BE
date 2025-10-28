import { Router } from "express"
import { loginController, registerController } from "~/controllers/admins/accounts.controllers"
import { registerValidation } from "~/middlewares/admins/validation.middlewares"
import { wrapHandlerFunction } from "~/utils/wrapHandler"
const accountRoutes = Router()

accountRoutes.post("/login", loginController)

/**
 * Description: Register a new user
 * PATH: admin/accounts/register
 * Method: Post
 * Body: { name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601, role: RoleAccount}
 */
accountRoutes.post("/register", registerValidation, wrapHandlerFunction(registerController))

export default accountRoutes
