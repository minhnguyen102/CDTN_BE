import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { createBookingController } from "../../controllers/guests/booking.controllers"
import { bookingValidation } from "../../middlewares/guests/guest.middlewares"

const bookingGuestRoutes = Router()

/**
 * Description: Khách gửi yêu cầu đặt bàn
 * Path: /guest/booking
 * Method: POST
 * Body: { name, phone, bookingDate, bookingTime, guestNumber, note }
 */
bookingGuestRoutes.post("/", bookingValidation, wrapHandlerFunction(createBookingController))

export default bookingGuestRoutes
