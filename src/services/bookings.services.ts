import { GetBookingListReqQuery } from "../models/requests/Booking.request"
import databaseService from "./database.servies"
import { removeAccents } from "../utils/helpers"
import { ObjectId } from "mongodb"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { BookingStatus } from "../constants/enums"
import { getIO } from "../utils/socket"

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

  async assignTable({ bookingId, tableId }: { bookingId: string; tableId: string }) {
    const tableObjectId = new ObjectId(tableId)

    const [booking, table] = await Promise.all([
      databaseService.bookings.findOneAndUpdate(
        { _id: new ObjectId(bookingId) },
        {
          $set: {
            tableId: tableObjectId,
            status: BookingStatus.COMPLETED,
            updatedAt: new Date()
          }
        },
        {
          returnDocument: "after"
        }
      ),
      databaseService.tables.findOne({
        _id: tableObjectId
      })
    ])
    if (!table) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.TABLE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    if (!booking) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.BOOKING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // SOCKET
    const io = getIO()
    io.to("admin_room").emit("booking_updated", {
      bookingId: booking,
      status: "Confirmed",
      message: "Đã xếp bàn thành công!"
    })
    return booking
  }
}

const bookingServices = new BookingServices()
export default bookingServices
