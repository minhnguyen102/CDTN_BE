import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, guestLoginValidation } from "../../middlewares/guests/guest.middlewares"
import { guestLoginController } from "../../controllers/guests/auth.controllers"

const guestRoutes = Router()

/**
 * Description: Guest Login via QR Code
 * Path: /
 * Body: { qrToken: string, guestName: string }
 */
guestRoutes.post("/login", guestLoginValidation, wrapHandlerFunction(guestLoginController))

export default guestRoutes
