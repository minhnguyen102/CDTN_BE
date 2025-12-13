import { Router } from "express"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { getAllReviews } from "../../controllers/admins/reviews.controllers"
const reviewRoutes = Router()

/**
 * Description: view all reviews (admin)
 * PATH: admin/reviews
 * Method: GET
 * Headers: {Authorization: Bearer access_token}
 */
reviewRoutes.get("/", accessTokenValidation, verifiedUserValidation, wrapHandlerFunction(getAllReviews))
export default reviewRoutes
