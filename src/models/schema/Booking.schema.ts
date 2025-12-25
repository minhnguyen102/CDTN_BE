import { ObjectId } from "mongodb"
import { BookingStatus } from "../../constants/enums"

interface BookingType {
  _id?: ObjectId
  guestInfo: {
    name: string
    phone: string
  }
  tableId: ObjectId
  bookingDate: Date
  bookingTime: string
  guestCount: number
  note: string
  status: BookingStatus
  // lưu lại lịch sử nội dung cuộc gọi
  callLogs: [
    {
      calledAt: Date
      callerId: ObjectId
      result: string
      note: string
    }
  ]
  createdAt: Date
  updatedAt: Date
}

export default class Booking {
  _id?: ObjectId
  guestInfo: {
    name: string
    phone: string
  }
  tableId: ObjectId
  bookingDate: Date
  bookingTime: string
  guestCount: number
  note: string
  status: BookingStatus
  callLogs: [
    {
      calledAt: Date
      callerId: ObjectId
      result: string
      note: string
    }
  ]
  createdAt: Date
  updatedAt: Date
  constructor(booking: BookingType) {
    const date = new Date()
    this._id = booking._id
    this.guestInfo = booking.guestInfo
    this.tableId = booking.tableId || null
    this.bookingDate = booking.bookingDate
    this.bookingTime = booking.bookingTime
    this.guestCount = booking.guestCount
    this.note = booking.note || ""
    this.status = booking.status || BookingStatus.PENDING
    this.callLogs = booking.callLogs || []
    this.createdAt = booking.createdAt || date
    this.updatedAt = booking.updatedAt || date
  }
}
