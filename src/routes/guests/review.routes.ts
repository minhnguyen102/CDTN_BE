import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, createReviewValidation } from "../../middlewares/guests/guest.middlewares"
import { createReviewController } from "../../controllers/guests/review.controllers"

const guestReviewsRouter = Router()

/**
 * Path: /guest/reviews
 * Method: POST
 * Header: Authorization: Bearer <Access_Token>
 * Body: { dishId, orderId, rating, comment }
 */
guestReviewsRouter.post("/", accessTokenValidation, createReviewValidation, wrapHandlerFunction(createReviewController))

export default guestReviewsRouter
