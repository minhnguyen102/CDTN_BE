import { Router } from "express"
import { loginController } from "~/controllers/admins/accounts.controllers"
const accountRoutes = Router()

accountRoutes.post("/login", loginController)

export default accountRoutes
