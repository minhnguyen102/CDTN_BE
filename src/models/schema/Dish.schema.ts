import { ObjectId } from "mongodb"
import { DishStatus } from "../../constants/enums"

interface DishRecipe {
  ingredientId: ObjectId // Tham chiếu đến collection 'ingredients'
  quantity: number // Số lượng tiêu hao cho 1 suất ăn (theo đơn vị gốc của kho)
}

interface DishType {
  _id?: ObjectId
  name: string
  price: number
  description: string
  status: DishStatus
  categoryId: ObjectId // Tham chiếu đến collection 'dish_categories' (Danh mục món)
  recipe: DishRecipe[]

  isFeatured?: boolean // true: Món nổi bật/Bán chạy (hiện lên đầu hoặc mục Hot)
  image?: string
  createdAt?: Date
  updatedAt?: Date
}

export default class Dish {
  _id?: ObjectId
  name: string
  price: number
  description: string
  status: DishStatus
  categoryId: ObjectId
  recipe: DishRecipe[]
  isFeatured: boolean
  image: string
  createdAt: Date
  updatedAt: Date

  constructor(dish: DishType) {
    const date = new Date()
    this.name = dish.name
    this.price = dish.price
    this.description = dish.description
    this.status = dish.status
    this.categoryId = dish.categoryId
    this.recipe = dish.recipe.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity
    }))
    this.isFeatured = dish.isFeatured || false
    this.image = dish.image || ""
    this.createdAt = dish.createdAt || date
    this.updatedAt = dish.updatedAt || date
  }
}
