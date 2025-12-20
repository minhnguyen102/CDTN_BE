import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, cartRecommendationValidation } from "../../middlewares/guests/guest.middlewares"
import { getRecommentdationController } from "../../controllers/guests/recommentdation.controllers"

const recommnentdationsRouter = Router()

recommnentdationsRouter.post(
  "",
  accessTokenValidation,
  cartRecommendationValidation,
  wrapHandlerFunction(getRecommentdationController)
)
export default recommnentdationsRouter
