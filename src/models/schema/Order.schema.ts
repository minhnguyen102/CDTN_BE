import { ObjectId } from "mongodb"
import { OrderStatus, OrderItemStatus } from "../../constants/enums"
import { Interface } from "readline"

export interface OrderItem {
  dishId: ObjectId
  dishName: string
  dishPrice: number
  dishImage: string
  quantity: number
  note: string
  orderedBy: string
  status: OrderItemStatus
  createdAt: Date
}

export interface OrderItemInput {
  dishId: string
  dishName: string
  dishPrice: number
  dishImage: string
  quantity: number
  note?: string
  orderedBy: string
  status?: OrderItemStatus
  createdAt?: Date
}

interface OrderType {
  _id?: ObjectId
  tableId: ObjectId
  tableNumber: number

  items: OrderItemInput[]

  // Thông tin thanh toán
  totalAmount: number
  discount?: number
  finalAmount?: number

  status: OrderStatus

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
  totalAmount: number
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
  finishedAt?: Date

  constructor(order: OrderType) {
    const date = new Date()
    this._id = order._id || new ObjectId()
    this.tableId = new ObjectId(order.tableId)
    this.tableNumber = order.tableNumber
    this.status = order.status || OrderStatus.Pending

    // Map dữ liệu items để đảm bảo tính đúng đắn
    this.items = order.items.map((item) => ({
      ...item,
      dishId: new ObjectId(item.dishId), // dữ liệu gửi lên là string nên mới phải custom lại
      note: item.note || "",
      status: item.status || OrderItemStatus.Pending,
      createdAt: item.createdAt || date
    }))

    // Tự động tính tổng tiền nếu không truyền vào
    this.totalAmount =
      order.totalAmount ||
      this.items.reduce((acc, item) => {
        return acc + item.dishPrice * item.quantity
      }, 0)

    this.createdAt = order.createdAt || date
    this.updatedAt = order.updatedAt || date
    this.finishedAt = order.finishedAt || undefined
  }
}
