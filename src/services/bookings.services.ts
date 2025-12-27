import { GetBookingListReqQuery } from "../models/requests/Booking.request"
import databaseService from "./database.servies"
import { removeAccents } from "../utils/helpers"

class BookingServices {
  async getAllBookings({ page, limit, status, date, search }: GetBookingListReqQuery) {
    const objectFind: any = {}
    if (status) {
      objectFind.status = status
    }

    if (date) {
      const searchDate = new Date(date)
      if (!isNaN(searchDate.getTime())) {
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999))
        objectFind.bookingDate = {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    }

    if (search) {
      objectFind.key_search = { $regex: removeAccents(search), $options: "i" }
    }

    const [bookings, totalCount] = await Promise.all([
      databaseService.bookings
        .find(objectFind)
        .sort({ createdAt: -1 }) // Mặc định xếp cái mới nhất lên đầu
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      databaseService.bookings.countDocuments(objectFind)
    ])
    return {
      bookings,
      total: totalCount,
      page,
      limit,
      total_pages: Math.ceil(totalCount / limit)
    }
  }
}

const bookingServices = new BookingServices()
export default bookingServices
