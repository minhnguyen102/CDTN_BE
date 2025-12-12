import { ObjectId } from "mongodb"

interface reviewType {
  // Input từ fe
  _id?: ObjectId
  dishId: string
  orderId: string
  authorName: string
  rating: number
  comment: string
  photos?: string // có thể gửi ảnh lên, nếu khôngg thì lưu string rỗng (upload 1 ảnh)
  createdAt?: Date
}

export default class Review {
  _id?: ObjectId
  dishId: ObjectId
  orderId: ObjectId
  authorName: string
  rating: number
  comment: string
  photos: string
  createdAt: Date

  constructor(review: reviewType) {
    const date = new Date()
    this._id = review._id
    this.dishId = new ObjectId(review.dishId)
    this.orderId = new ObjectId(review.orderId)
    this.authorName = review.authorName || "Khách ẩn danh"
    this.rating = review.rating || 5
    this.comment = review.comment || ""
    this.photos = review.photos || ""
    this.createdAt = date
  }
}
