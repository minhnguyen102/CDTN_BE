import { CategoryTypeStatus } from "../../constants/enums"

export interface createCategoryReqBody {
  name: string
  description: string
  status: CategoryTypeStatus
}
