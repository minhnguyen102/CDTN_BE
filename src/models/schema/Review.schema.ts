import { ObjectId } from "mongodb"
import { ReviewStatus } from "../../constants/enums"

interface reviewType {
  // Input từ fe
  _id?: ObjectId
  dishId: string
  orderId: string
  authorName: string
  rating: number
  comment: string
  status?: ReviewStatus
  reply?: {
    content: string
    adminId: string // dữ liệu gửi lên
    createdAt: Date
  }
  createdAt?: Date
}

export default class Review {
  _id?: ObjectId
  dishId: ObjectId
  orderId: ObjectId
  authorName: string
  rating: number
  comment: string
  status: ReviewStatus
  reply?: {
    content: string
    adminId: ObjectId // lưu trong db
    createdAt: Date
  }
  createdAt: Date

  constructor(review: reviewType) {
    const date = new Date()
    this._id = review._id
    this.dishId = new ObjectId(review.dishId)
    this.orderId = new ObjectId(review.orderId)
    this.authorName = review.authorName || "Khách ẩn danh"
    this.rating = review.rating || 5
    this.comment = review.comment || ""
    this.status = review.status || ReviewStatus.ACTIVE
    if (review.reply) {
      this.reply = {
        content: review.reply.content,
        adminId: new ObjectId(review.reply.adminId),
        createdAt: review.reply.createdAt || date
      }
    }
    this.createdAt = date
  }
}
