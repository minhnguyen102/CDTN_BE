import { ObjectId } from "mongodb"
import { OrderItemStatus, PaymentStatus, PaymentMethod } from "../../constants/enums"
import { Interface } from "readline"

export interface OrderItem {
  _id: ObjectId
  dishId: ObjectId
  dishName: string
  dishPrice: number
  dishImage: string
  quantity: number
  note: string
  orderedBy: string
  status: OrderItemStatus
  createdAt: Date
  managedBy: string
  processingHistory: {
    status: OrderItemStatus
    updatedBy: string
    updatedAt: Date
  }[]
}

export interface OrderItemInput {
  _id?: ObjectId
  dishId: string
  dishName: string
  dishPrice: number
  dishImage: string
  quantity: number
  note?: string
  orderedBy: string
  status?: OrderItemStatus
  createdAt?: Date
  managedBy?: string
  processingHistory?: {
    status: OrderItemStatus
    updatedBy: string
    updatedAt: Date
  }[]
}

interface OrderType {
  _id?: ObjectId
  tableId: ObjectId
  tableNumber: number
  items: OrderItemInput[]
  guestName: string

  // Thông tin thanh toán
  totalAmount?: number
  discount?: number
  finalAmount?: number

  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod

  // Thời gian
  createdAt?: Date // Thời gian tạo đơn (lần đầu gọi món)
  updatedAt?: Date // Thời gian cập nhật (gọi thêm món)
  finishedAt?: Date // Thời gian thanh toán xong
}

export default class Order {
  _id?: ObjectId
  tableId: ObjectId
  tableNumber: number
  items: OrderItem[]
  guestName: string
  totalAmount: number
  createdAt: Date
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
  updatedAt: Date
  finishedAt?: Date

  constructor(order: OrderType) {
    const date = new Date()
    this._id = order._id || new ObjectId()
    this.tableId = new ObjectId(order.tableId)
    this.tableNumber = order.tableNumber

    // Map dữ liệu items để đảm bảo tính đúng đắn
    this.items = order.items.map((item) => ({
      ...item,
      _id: new ObjectId(),
      dishId: new ObjectId(item.dishId), // dữ liệu gửi lên là string nên mới phải custom lại
      note: item.note || "",
      status: item.status || OrderItemStatus.Pending,
      createdAt: item.createdAt || date,
      managedBy: (item as any).managedBy || "",
      processingHistory: (item as any).processingHistory || []
    }))

    this.guestName = order.guestName

    // Tự động tính tổng tiền nếu không truyền vào
    this.totalAmount =
      order.totalAmount ||
      this.items.reduce((acc, item) => {
        return acc + item.dishPrice * item.quantity
      }, 0)
    this.paymentStatus = order.paymentStatus || PaymentStatus.UNPAID
    this.paymentMethod = order.paymentMethod || PaymentMethod.CASH
    this.createdAt = order.createdAt || date
    this.updatedAt = order.updatedAt || date
    this.finishedAt = order.finishedAt || undefined
  }
}
