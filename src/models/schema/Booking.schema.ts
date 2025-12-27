import { ObjectId } from "mongodb"
import { BookingStatus } from "../../constants/enums"

interface callLogItem {
  calledAt: Date
  callerId: ObjectId
  result: string
  note: string
}

interface BookingType {
  _id?: ObjectId
  guestInfo: {
    name: string
    phone: string
  }
  tableId?: ObjectId
  bookingDate: Date
  bookingTime: string
  guestNumber: number
  note: string
  status: BookingStatus
  key_search: string
  // lưu lại lịch sử nội dung cuộc gọi
  callLogs?: callLogItem[]
  createdAt?: Date
  updatedAt?: Date
}

export default class Booking {
  _id?: ObjectId
  guestInfo: {
    name: string
    phone: string
  }
  tableId?: ObjectId
  bookingDate: Date
  bookingTime: string
  guestNumber: number
  note: string
  status: BookingStatus
  key_search: string
  callLogs: callLogItem[]
  createdAt: Date
  updatedAt: Date
  constructor(booking: BookingType) {
    const date = new Date()
    this._id = booking._id
    this.guestInfo = booking.guestInfo
    this.tableId = booking.tableId || undefined
    this.bookingDate = booking.bookingDate
    this.bookingTime = booking.bookingTime
    this.guestNumber = booking.guestNumber
    this.note = booking.note || ""
    this.key_search = booking.key_search || ""
    this.status = booking.status || BookingStatus.PENDING
    this.callLogs = booking.callLogs || []
    this.createdAt = booking.createdAt || date
    this.updatedAt = booking.updatedAt || date
  }
}
