import { Router } from "express"
import { loginController, registerController } from "~/controllers/admins/accounts.controllers"
const accountRoutes = Router()

accountRoutes.post("/login", loginController)
accountRoutes.post("/register", registerController)

export default accountRoutes
