export interface CreateReviewReqBody {
  dishId: string
  orderId: string
  rating: number // 1 - 5
  comment?: string
}
