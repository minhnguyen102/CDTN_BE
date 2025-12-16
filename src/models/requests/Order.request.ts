import { OrderItemStatus } from "../../constants/enums"
import { DishItemInputFE } from "../../services/guests.services"

export interface CreateOrderReqBody {
  items: {
    dishId: string
    quantity: number
    note: string
  }[]
}

export interface CreateOrderPayload {
  tableId: string
  guestName: string
  items: DishItemInputFE[]
}

export interface UpdateStatusItemInOrdersReqBody {
  status: OrderItemStatus
}

export interface CreateOrderForTableController {
  tableId: string
  guestName: string
  items: {
    dishId: string
    quantity: number
    note: string
  }[]
}
