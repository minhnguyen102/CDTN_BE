import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import { getAllBookingsController } from "../../controllers/admins/bookings.controllers"
const bookingAdminRoutes = Router()

/**
 * Path: /bookings
 * Method: GET
 * Query: ?page=1&limit=10&status=Pending&date=2025-12-25
 * * Headers: {Authorization: Bearer access_token}
 */
bookingAdminRoutes.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  // checkPermission("view_bookings"), // chưa tạo
  // getAllBookingValidation
  wrapHandlerFunction(getAllBookingsController)
)

export default bookingAdminRoutes
