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

export interface GetOrderList {
  tableId: string
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

export interface PayByCash {
  orderId: string
}
