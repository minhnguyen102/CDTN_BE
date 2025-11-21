import { DishCategoryStatus } from "../../constants/enums"

export interface CreateDishCategoryReqBody {
  name: string
  display_order: number
  status: DishCategoryStatus
  description?: string
}
export interface UpdateDishCategoryReqBody {
  name?: string
  display_order?: number
  status?: DishCategoryStatus
  image?: string
  description?: string
}
