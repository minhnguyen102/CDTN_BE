import { DishCategoryStatus } from "../../constants/enums"

export interface CreateDishCategoryReqBody {
  name: string
  displayOrder: number
  status: DishCategoryStatus
  description?: string
}
