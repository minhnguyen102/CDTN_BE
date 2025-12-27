import { BookingStatus } from "../../constants/enums"

export interface GetBookingListReqQuery {
  page: number
  limit: number
  status?: BookingStatus
  date?: string
  search?: string // Tìm theo tên hoặc SĐT
}

export interface assignTableReqBody {
  tableId: string
}
