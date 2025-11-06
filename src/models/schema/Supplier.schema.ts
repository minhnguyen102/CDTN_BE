import { ObjectId } from "mongodb"

interface SupplierType {
  _id?: ObjectId
  name: string
  contactPerson: string // Hieu Bui
  phone: string
  email: string
  address: string
  createdAt: Date
  updatedAt: Date
}

export default class Supplier {
  _id?: ObjectId
  name: string
  contactPerson: string // Hieu Bui
  phone: string
  email: string
  address: string
  createdAt: Date
  updatedAt: Date

  constructor(supplier: SupplierType) {
    const date = new Date()
    this._id = supplier._id
    this.name = supplier.name
    this.contactPerson = supplier.contactPerson
    this.phone = supplier.phone
    this.email = supplier.email
    this.address = supplier.address
    this.createdAt = supplier.createdAt || date
    this.updatedAt = supplier.updatedAt || date
  }
}
