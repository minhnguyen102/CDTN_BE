import { ObjectId } from "mongodb"
import { CreateReviewReqBody } from "../models/requests/Review.request"
import databaseService from "./database.servies"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { PaymentStatus, ReviewStatus } from "../constants/enums"
import Account from "../models/schema/Account.schema"

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
    const { orderId, reviews } = payload
    const objectOrderId = new ObjectId(orderId)
    const order = await databaseService.orders.findOne({
      _id: objectOrderId
    })

    if (!order || order.paymentStatus !== PaymentStatus.PAID) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ORDER_NOT_FOUND_OR_ORDER_NOT_PAID,
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

    const existingReview = await databaseService.reviews.findOne({ orderId: objectOrderId })

    if (existingReview) {
      throw new ErrorWithStatus({
        message: "Đơn hàng này đã được đánh giá. Cảm ơn bạn!",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Chỉ lọc ra những review có rating được gửi lên
    const reviewDocs = reviews
      .filter((review) => review.rating > 0)
      .map((r) => ({
        dishId: new ObjectId(r.dishId),
        orderId: objectOrderId,
        authorName: user_name,
        rating: r.rating,
        comment: r.comment || "",
        status: ReviewStatus.ACTIVE,
        createdAt: new Date(),
        reply: undefined
      }))

    if (reviewDocs.length === 0) return { message: "Không có đánh giá nào được ghi nhận" }

    await databaseService.reviews.insertMany(reviewDocs)

    // Đánh giá lại sao đồng thời
    const uniqueDishIds = [...new Set(reviews.map((item) => item.dishId))]
    await Promise.all(uniqueDishIds.map((dishId) => this.updateDishRating({ dishId })))
    // return { count: reviewDocs.length }
  }

  async getReviewsByDish({ dishId, page, limit }: { dishId: string; page: number; limit: number }) {
    const reivews = await databaseService.reviews
      .aggregate([
        {
          $match: {
            dishId: new ObjectId(dishId),
            status: ReviewStatus.ACTIVE
          }
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "dishes",
            localField: "dishId",
            foreignField: "_id",
            as: "dishInfo"
          }
        },
        {
          $unwind: {
            path: "$dishInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            authorName: 1,
            rating: 1,
            comment: 1,
            reply: 1,
            createdAt: 1,
            dishName: "$dishInfo.name",
            dishImage: "$dishInfo.image"
          }
        }
      ])
      .toArray()

    if (!reivews) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.REVIEW_NOT_FOUND,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    return reivews
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
        .aggregate([
          { $match: match },
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: "dishes",
              localField: "dishId",
              foreignField: "_id",
              as: "dishInfo"
            }
          },
          {
            $unwind: {
              path: "$dishInfo",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              dishId: 1,
              orderId: 1,
              authorName: 1,
              rating: 1,
              comment: 1,
              photos: 1,
              status: 1,
              reply: 1,
              createdAt: 1,
              updatedAt: 1,
              dishName: "$dishInfo.name", // Lấy tên món
              dishImage: "$dishInfo.image"
            }
          }
        ])
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

  async changeReviewStatus({ reviewId, status }: { reviewId: string; status: string }) {
    const review = await databaseService.reviews.findOneAndUpdate(
      {
        _id: new ObjectId(reviewId)
      },
      {
        $set: {
          status: status as ReviewStatus
        }
      },
      {
        returnDocument: "after"
      }
    )
    if (!review) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.REVIEW_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return review
  }

  async replyReview({ review_id, content, admin_id }: { review_id: string; content: string; admin_id: string }) {
    const review = await databaseService.reviews.findOneAndUpdate(
      {
        _id: new ObjectId(review_id)
      },
      {
        $set: {
          reply: {
            content: content,
            adminId: new ObjectId(admin_id),
            createdAt: new Date()
          }
        }
      },
      {
        returnDocument: "after"
      }
    )

    if (!review) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.REVIEW_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return review
  }
}

const reviewService = new ReviewService()
export default reviewService
