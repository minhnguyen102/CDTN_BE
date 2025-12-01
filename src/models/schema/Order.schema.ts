import { ObjectId } from "mongodb"
import { OrderStatus } from "../../constants/enums"

interface OrderItem {
  dishId: ObjectId
  dishName: string
  quantity: number
  dishPrice: number
  note?: string
  status: "Pending" | "Cooking" | "Done"
}

interface OrderItemInput {
  dishId: string // Khi Fe gửi lên sẽ là string
  dishName: string
  quantity: number
  dishPrice: number
  note?: string
  status: "Pending" | "Cooking" | "Done"
}

interface OrderType {
  _id?: ObjectId
  tableNumber: number
  tableId: ObjectId
  items: OrderItemInput[]
  totalAmount: number
  status: OrderStatus
  createdAt?: Date
  updatedAt?: Date
}

export default class Order {
  _id?: ObjectId
  tableNumber: number
  tableId: ObjectId
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  createdAt: Date
  updatedAt: Date

  constructor(order: OrderType) {
    const date = new Date()
    this._id = order._id || new ObjectId()
    this.tableNumber = order.tableNumber
    this.tableId = new ObjectId(order.tableId)
    this.status = order.status || OrderStatus.Pending
    this.createdAt = order.createdAt || date
    this.updatedAt = order.updatedAt || date

    this.items = order.items.map((item) => ({
      ...item,
      dishId: new ObjectId(item.dishId) // chuyển đổi từ string sang ObjectId
    }))
    this.totalAmount = order.totalAmount || this.items.reduce((acc, item) => acc + item.dishPrice * item.quantity, 0)
  }
}
