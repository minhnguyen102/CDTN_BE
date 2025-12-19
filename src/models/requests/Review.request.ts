export interface CreateReviewReqBody {
  orderId: string
  reviews: {
    dishId: string
    rating: number // 1 - 5
    comment?: string
  }[]
}
