import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation } from "../../middlewares/guests/guest.middlewares"
import { guestLoginController } from "../../controllers/guests/auth.controllers"
import { getGuestMenuController } from "../../controllers/guests/menu.controllers"

const menuGuestRoutes = Router()

/**
 * Description: Get full menu (Grouped by Category)
 * PATH: /guest/menu
 * Method: GET
 * Header: Authorization: Bearer <GuestToken>
 */
menuGuestRoutes.get("/", accessTokenValidation, wrapHandlerFunction(getGuestMenuController))

export default menuGuestRoutes
