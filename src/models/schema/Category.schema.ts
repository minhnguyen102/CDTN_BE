import { ObjectId } from "mongodb"
import { CategoryTypeStatus } from "../../constants/enums"

interface CategoryType {
  _id?: ObjectId
  name: string
  description: string
  status: CategoryTypeStatus
  createdAt?: Date
  updatedAt?: Date
}

export default class Category {
  _id?: ObjectId
  name: string
  description: string
  status: CategoryTypeStatus
  createdAt: Date
  updatedAt: Date

  constructor(category: CategoryType) {
    const date = new Date()
    this._id = category._id
    this.name = category.name
    this.description = category.description
    this.status = category.status
    this.createdAt = category.createdAt || date
    this.updatedAt = category.updatedAt || date
  }
}
