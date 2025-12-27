import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import HTTP_STATUS from "../../constants/httpStatus"
import USER_MESSAGES from "../../constants/message"
import { paginationQueryParser } from "../../utils/helpers"
import { assignTableReqBody, GetBookingListReqQuery } from "../../models/requests/Booking.request"
import bookingServices from "../../services/bookings.services"
import { BookingStatus } from "../../constants/enums"

export const getAllBookingsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit } = paginationQueryParser(req, {
    defaultLimit: 10,
    allowLimits: [10, 20, 30]
  })
  const date = (req.query.date as string) || undefined
  const search = (req.query.search as string) || undefined
  const status = (req.query.status as BookingStatus) || undefined
  const result = await bookingServices.getAllBookings({ page, limit, date, search, status })
  res.json({
    message: "Lấy danh sách đặt bàn thành công",
    data: result
  })
}

export const assignTableController = async (req: Request<ParamsDictionary, any, assignTableReqBody>, res: Response) => {
  const { bookingId } = req.params
  const { tableId } = req.body
  const result = await bookingServices.assignTable({ bookingId, tableId })
  res.json({
    message: "Xếp bàn cho đơn đặt thành công",
    data: result
  })
}
