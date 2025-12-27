export interface GuestLoginReqBody {
  guestName: string
  qrToken: string
}

export interface CreateBookingReqBody {
  name: string
  phone: string
  bookingDate: string // isISO8601
  bookingTime: string
  guestNumber: number
  note: string
}
