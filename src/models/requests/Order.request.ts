export interface CreateOrderReqBody {
  items: {
    dishId: string
    quantity: number
    note: string
  }[]
}
