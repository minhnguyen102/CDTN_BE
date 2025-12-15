import { ObjectId } from "mongodb"
import { CreateReviewReqBody } from "../models/requests/Review.request"
import databaseService from "./database.servies"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { PaymentStatus } from "../constants/enums"
import Review from "../models/schema/Review.schema"

class ReviewService {
  async createReview({
    user_id,
    user_name,
    payload
  }: {
    user_id: string
    user_name: string
    payload: CreateReviewReqBody
  }) {
    // Kiểm tra điều kiện đánh giá
    const { orderId, dishId, comment, rating } = payload
    const dishObjectId = new ObjectId(dishId)
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(orderId)
    })

    if (!order) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ORDER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (order.tableId.toString() !== user_id) {
      // Vì lưu user_id là id của bàn
      throw new ErrorWithStatus({
        message: USER_MESSAGES.YOU_NOT_ALLOW_REVIEW_THIS_ORDER,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ORDER_NOT_PAID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Tìm kiếm có món đó trong items của order không => some
    const existDishId = order.items.some((dish) => dish.dishId.toString() === payload.dishId)
    if (!existDishId) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.DISH_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const existingReview = await databaseService.reviews.findOne({
      orderId: new ObjectId(orderId),
      dishId: dishObjectId
    })

    if (existingReview) {
      // Món đã được đánh giá
      throw new ErrorWithStatus({
        message: USER_MESSAGES.THIS_ITEMS_ALREADY_REVIEWED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Lưu đánh giá + chỉnh sửa lại rating
    const review = await databaseService.reviews.insertOne(
      new Review({
        dishId: dishId,
        orderId: orderId,
        authorName: user_name,
        comment: comment || "",
        rating: rating
      })
    )
    // Cập nhật lại 2 trường ratingAverage, reviewCount
    const stats = await databaseService.reviews
      .aggregate([
        { $match: { dishId: dishObjectId } },
        {
          $group: {
            _id: "$dishId",
            avgRating: { $avg: "$rating" }, // Tính trung bình
            count: { $sum: 1 } // Đếm tổng số
          }
        }
      ])
      .toArray()

    // console.log("stats: ", stats)

    if (stats.length > 0) {
      const { avgRating, count } = stats[0]

      await databaseService.dishes.updateOne(
        { _id: dishObjectId },
        {
          $set: {
            ratingAverage: Math.round(avgRating * 10) / 10,
            reviewCount: count
          }
        }
      )
    }
    return review
  }
}

const reviewService = new ReviewService()
export default reviewService
