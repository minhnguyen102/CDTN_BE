import { ObjectId } from "mongodb"
import { ImportOrderStatus } from "../../constants/enums"

interface ImportOrderItem {
  ingredientId: ObjectId
  ingredientName: string
  quantity: number
  importPrice: number
  total: number
}

interface ImportOrderType {
  _id?: ObjectId
  orderNumber: string
  supplierId: ObjectId
  importedById: ObjectId
  importDate: Date
  status: ImportOrderStatus
  items: ImportOrderItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export default class ImportOrder {
  _id?: ObjectId
  orderNumber: string
  supplierId: ObjectId
  importedById: ObjectId
  importDate: Date
  status: ImportOrderStatus
  items: ImportOrderItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  notes: string
  createdAt: Date
  updatedAt: Date

  constructor(importOrder: ImportOrderType) {
    const date = new Date()
    this._id = importOrder._id
    this.orderNumber = importOrder.orderNumber
    this.supplierId = importOrder.supplierId
    this.importedById = importOrder.importedById
    this.importDate = importOrder.importDate
    this.status = importOrder.status
    this.items = importOrder.items.map((item) => ({
      // map() để đảm bảo cấu trúc
      ingredientId: new ObjectId(item.ingredientId),
      ingredientName: item.ingredientName,
      quantity: item.quantity,
      importPrice: item.importPrice,
      total: item.total
    }))
    this.subtotal = importOrder.subtotal
    this.taxRate = importOrder.taxRate
    this.taxAmount = importOrder.taxAmount
    this.totalAmount = importOrder.totalAmount
    this.notes = importOrder.notes || ""
    this.createdAt = importOrder.createdAt || date
    this.updatedAt = importOrder.updatedAt || date
  }
}
