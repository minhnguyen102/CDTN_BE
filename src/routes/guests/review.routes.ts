import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import {
  accessTokenValidation,
  createReviewValidation,
  getReviewValidation
} from "../../middlewares/guests/guest.middlewares"
import { createReviewController, getReviewsByDishController } from "../../controllers/guests/review.controllers"

const guestReviewsRouter = Router()

/**
 * Path: /guest/reviews
 * Method: POST
 * Header: Authorization: Bearer <Access_Token>
 * Body: { dishId, orderId, rating, comment }
 */
guestReviewsRouter.post("/", accessTokenValidation, createReviewValidation, wrapHandlerFunction(createReviewController))

/**
 * Description: Lấy danh sách đánh giá của một món ăn
 * Method: GET
 * Path: /guests/reviews/:dishId
 * Query: ?page=1&limit=5
 */
guestReviewsRouter.get(
  "/:dishId",
  accessTokenValidation,
  getReviewValidation,
  wrapHandlerFunction(getReviewsByDishController)
)

export default guestReviewsRouter
