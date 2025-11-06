import { ObjectId } from "mongodb"
import { SupplierStatus } from "../../constants/enums"

interface SupplierType {
  _id?: ObjectId
  name: string
  taxCode: string // mã số thuế
  status: SupplierStatus // (Rất quan trọng) "Active" hoặc "Inactive"
  contactPerson: string // Hieu Bui
  phone: string
  email: string
  address: string
  createdAt?: Date
  updatedAt?: Date
}

export default class Supplier {
  _id?: ObjectId
  name: string
  taxCode: string
  status: SupplierStatus
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
    this.taxCode = supplier.taxCode
    this.status = supplier.status
    this.contactPerson = supplier.contactPerson
    this.phone = supplier.phone
    this.email = supplier.email
    this.address = supplier.address
    this.createdAt = supplier.createdAt || date
    this.updatedAt = supplier.updatedAt || date
  }
}
