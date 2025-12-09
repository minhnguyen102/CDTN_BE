import { OrderItemStatus } from "../../constants/enums"

export interface CreateOrderReqBody {
  items: {
    dishId: string
    quantity: number
    note: string
  }[]
}

export interface UpdateStatusItemInOrdersReqBody {
  status: OrderItemStatus
}
