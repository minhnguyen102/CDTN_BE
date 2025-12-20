import { Router } from "express"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import {
  changeReviewStatusController,
  getAllReviewForAdminController,
  replyReviewController
} from "../../controllers/admins/reviews.controllers"
import {
  changeReviewStatusValidation,
  getAllReviewForAdminValidation,
  replyReviewValidation
} from "../../middlewares/admins/reviews.middlewares"

const adminReviewsRoutes = Router()

/**
 * Description: Lấy danh sách tất cả đánh giá (Có filter, sort)
 * Method: GET
 * Path: /admin/reviews
 * Query: ?page=1&limit=10&status=Active&rating=5
 */
adminReviewsRoutes.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  // checkPermission("view_reviews"), // Chưa tạo mơi
  getAllReviewForAdminValidation,
  wrapHandlerFunction(getAllReviewForAdminController)
)

/**
 * Description: Trả lời đánh giá
 * Method: POST
 * Path: /admin/reviews/:reviewId/reply
 * Body: { content: "Cảm ơn bạn..." }
 */
adminReviewsRoutes.post(
  "/:reviewId/reply",
  accessTokenValidation,
  verifiedUserValidation,
  replyReviewValidation,
  // checkPermission("active_hidden_review"), // Chưa tạo mơi
  wrapHandlerFunction(replyReviewController)
)

/**
 * Description: Ẩn/Hiện đánh giá (Xử lý vi phạm)
 * Method: PATCH
 * Path: /admin/reviews/:reviewId/status
 * Body: { status: "Hidden" }
 */
adminReviewsRoutes.patch(
  "/:reviewId/:status",
  accessTokenValidation,
  verifiedUserValidation,
  // checkPermission("active_hidden_review"), // Chưa tạo mơi
  changeReviewStatusValidation,
  wrapHandlerFunction(changeReviewStatusController)
)

export default adminReviewsRoutes
