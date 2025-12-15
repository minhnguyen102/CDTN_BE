import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, getMenuValidation } from "../../middlewares/guests/guest.middlewares"
import { getDishCategories, getGuestMenuController } from "../../controllers/guests/menu.controllers"

const menuGuestRoutes = Router()

/**
 * Description: Get list dish category
 * PATH: /guest/dish-categories
 * Method: GET
 * Header: Authorization: Bearer <GuestToken>
 */
menuGuestRoutes.get("/dish-categories", accessTokenValidation, wrapHandlerFunction(getDishCategories))

/**
 * Description: Get full menu (Grouped by Category)
 * PATH: /guest/menu
 * Method: GET
 * Header: Authorization: Bearer <GuestToken>
 */
menuGuestRoutes.get(
  "/:categoryId/dishes",
  accessTokenValidation,
  getMenuValidation,
  wrapHandlerFunction(getGuestMenuController)
)

export default menuGuestRoutes
