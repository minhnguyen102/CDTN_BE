import { Router } from "express"
import { loginController, registerController } from "~/controllers/admins/accounts.controllers"
import { registerValidation } from "~/middlewares/admins/validation.middlewares"
const accountRoutes = Router()

accountRoutes.post("/login", loginController)

accountRoutes.post("/register", registerValidation, registerController)

export default accountRoutes
