import { ObjectId } from "mongodb"
import { DishCategoryStatus } from "../../constants/enums"

interface DishCategoryType {
  _id?: ObjectId
  name: string
  display_order: number
  status: DishCategoryStatus
  image: string
  image_id: string
  key_search: string
  description?: string
  deleted?: boolean
  deletedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export default class DishCategory {
  _id?: ObjectId
  name: string
  display_order: number
  status: DishCategoryStatus
  key_search: string
  image: string
  image_id: string
  description: string
  deleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date

  constructor(dishCategory: DishCategoryType) {
    const date = new Date()
    this._id = dishCategory._id
    this.name = dishCategory.name
    this.display_order = dishCategory.display_order
    this.status = dishCategory.status
    this.key_search = dishCategory.key_search
    this.image = dishCategory.image
    this.image_id = dishCategory.image_id
    this.description = dishCategory.description || ""
    this.deleted = dishCategory.deleted || false
    this.deletedAt = dishCategory.deletedAt || null
    this.createdAt = dishCategory.createdAt || date
    this.updatedAt = dishCategory.updatedAt || date
  }
}
