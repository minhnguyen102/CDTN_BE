import { ObjectId } from "mongodb"
import { CreateReviewReqBody } from "../models/requests/Review.request"
import databaseService from "./database.servies"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { PaymentStatus, ReviewStatus } from "../constants/enums"
import Review from "../models/schema/Review.schema"

class ReviewService {
  private async updateDishRating({ dishId }: { dishId: string }) {
    const result = await databaseService.reviews
      .aggregate([
        {
          $match: {
            dishId: new ObjectId(dishId),
            status: ReviewStatus.ACTIVE
          }
        },
        {
          $group: {
            _id: "$dishId",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
          }
        }
      ])
      .toArray()
    console.log("result: ", result)

    if (result.length > 0) {
      const { averageRating, totalReviews } = result[0]

      await databaseService.dishes.updateOne(
        { _id: new ObjectId(dishId) },
        {
          $set: {
            ratingAverage: Math.round(averageRating * 10) / 10,
            reviewCount: totalReviews
          }
        }
      )
    } else {
      await databaseService.dishes.updateOne(
        { _id: new ObjectId(dishId) },
        { $set: { ratingAverage: 0, reviewCount: 0 } }
      )
    }
  }

  // GUEST
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
    // Cập nhật lại avgRating và totalReview
    await this.updateDishRating({ dishId })
    return review
  }

  // ADMIN
  async getReviewsForAdmin({
    page,
    limit,
    status,
    dishId,
    rating
  }: {
    page: number
    limit: number
    status: string
    dishId: string
    rating: number
  }) {
    // Kiểm tra giá trị status
    // Check bên validate
    // const validStatus = Object.values(ReviewStatus).some((item) => item === status)
    // if (!validStatus) {
    //   throw new ErrorWithStatus({
    //     message: USER_MESSAGES.INVALID_REVIEW_STATUS,
    //     status: HTTP_STATUS.BAD_REQUEST
    //   })
    // }

    const match: any = {}
    if (status) {
      match.status = status
    }
    if (dishId) {
      match.dishId = new ObjectId(dishId)
    }
    if (rating) {
      match.rating = rating
    }

    const [reviews, totalReview] = await Promise.all([
      databaseService.reviews
        .find(match)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      databaseService.reviews.countDocuments(match)
    ])

    return {
      reviews,
      totalReview,
      page,
      limit,
      totalPages: Math.ceil(totalReview / limit)
    }
  }
}

const reviewService = new ReviewService()
export default reviewService
