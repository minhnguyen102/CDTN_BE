import { ObjectId } from "mongodb"
import { DishStatus } from "../../constants/enums"

export interface DishRecipe {
  ingredientId: ObjectId
  quantity: number
}

interface DishType {
  _id?: ObjectId
  name: string
  price: number
  description: string
  image: string
  image_id?: string
  status: DishStatus
  categoryId: ObjectId
  recipe: DishRecipe[]

  isFeatured?: boolean
  deleted?: boolean
  deletedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export default class Dish {
  _id?: ObjectId
  name: string
  price: number
  description?: string
  image: string
  image_id: string
  status: DishStatus
  categoryId: ObjectId
  recipe: DishRecipe[]
  isFeatured: boolean
  deleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date

  constructor(dish: DishType) {
    const date = new Date()
    this.name = dish.name
    this.price = dish.price
    this.description = dish.description || ""
    this.image = dish.image
    this.image_id = dish.image_id || ""
    this.status = dish.status
    this.categoryId = new ObjectId(dish.categoryId)

    this.recipe = (dish.recipe || []).map((item) => ({
      ingredientId: new ObjectId(item.ingredientId),
      quantity: item.quantity
    }))

    this.isFeatured = dish.isFeatured || false
    this.deleted = dish.deleted || false
    this.deletedAt = dish.deletedAt || null
    this.createdAt = dish.createdAt || date
    this.updatedAt = dish.updatedAt || date
  }
}
