import { ObjectId } from "mongodb"
import { TableStatus } from "~/constants/enums"

interface TableType {
  _id?: ObjectId
  number: number // (Tạo unique index)
  capacity: number
  status: TableStatus
  qrToken: string // Token cho QR code
  currentOrderId: ObjectId | null
  createdAt: Date
  updatedAt: Date
}

export default class Table {
  _id?: ObjectId
  number: number // (Tạo unique index)
  capacity: number // số ghế
  status: TableStatus
  qrToken: string // Token cho QR code
  currentOrderId: ObjectId | null
  createdAt: Date
  updatedAt: Date

  constructor(table: TableType) {
    const date = new Date()
    this._id = table._id
    this.number = table.number
    this.capacity = table.capacity
    this.status = table.status
    this.qrToken = table.qrToken
    this.currentOrderId = table.currentOrderId
    this.createdAt = table.createdAt || date
    this.updatedAt = table.updatedAt || date
  }
}
