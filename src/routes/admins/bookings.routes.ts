import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import { assignTableController, getAllBookingsController } from "../../controllers/admins/bookings.controllers"
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
/**
 * Path: /bookings/:status
 * Method: PATCH
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

/**
 * Path: /bookings/:bookingId/assign-table
 * Method: PUT
 * Body: { "tableId": "65ae..." }
 * Desc: Admin chọn bàn cho khách -> Đơn thành Confirmed
 */
bookingAdminRoutes.patch(
  "/:bookingId/assign-table",
  accessTokenValidation,
  verifiedUserValidation,
  wrapHandlerFunction(assignTableController)
)
export default bookingAdminRoutes
