import { ObjectId } from "mongodb"
import { DishCategoryStatus } from "../../constants/enums"

interface DishCategoryType {
  _id?: ObjectId
  name: string
  displayOrder: number // 1, 2, 3... để sắp xếp thứ tự hiển thị trên Menu
  status: DishCategoryStatus
  image: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export default class DishCategory {
  _id?: ObjectId
  name: string
  displayOrder: number // 1, 2, 3... để sắp xếp thứ tự hiển thị trên Menu
  status: DishCategoryStatus
  image: string
  description: string
  createdAt?: Date
  updatedAt?: Date

  constructor(dishCategory: DishCategoryType) {
    const date = new Date()
    this._id = dishCategory._id
    this.name = dishCategory.name
    this.displayOrder = dishCategory.displayOrder
    this.status = dishCategory.status
    this.image = dishCategory.image
    this.description = dishCategory.description || ""
    this.createdAt = dishCategory.createdAt || date
    this.updatedAt = dishCategory.updatedAt || date
  }
}
