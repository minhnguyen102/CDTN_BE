import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, createOrderValidation } from "../../middlewares/guests/guest.middlewares"
import { getGuestMenuController } from "../../controllers/guests/menu.controllers"
import { createOrderController } from "../../controllers/guests/order.controllers"

const orderGuestRoutes = Router()

/**
 * Description: Guest place order
 * PATH: /guest/orders
 * Method: POST
 * Header: Authorization: Bearer <GuestToken>
 * Body: { items: [{ dishId: "...", quantity: 2, note: "..." }] }
 */
orderGuestRoutes.post("/", accessTokenValidation, createOrderValidation, wrapHandlerFunction(createOrderController))

export default orderGuestRoutes
