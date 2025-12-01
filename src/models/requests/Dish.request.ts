import { DishStatus } from "../../constants/enums"

export interface CreateDishReqBody {
  name: string
  price: number
  description: string
  image: string
  status: DishStatus
  categoryId: string
  recipe: {
    ingredientId: string
    quantity: number
  }[]
  isFeatured?: boolean
}

export interface UpdateDishReqBody {
  name?: string
  price?: number
  description?: string
  image?: string
  status?: DishStatus
  categoryId?: string
  recipe?: {
    ingredientId: string
    quantity: number
  }[]
  isFeatured?: boolean
}
