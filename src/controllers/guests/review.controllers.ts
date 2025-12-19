import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { CreateReviewReqBody } from "../../models/requests/Review.request"
import { TokenPayload } from "../../models/requests/Account.request"
import { pick } from "lodash"
import reviewService from "../../services/reviews.services"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { paginationQueryParser } from "../../utils/helpers"

export const createReviewController = async (
  req: Request<ParamsDictionary, any, CreateReviewReqBody>,
  res: Response
) => {
  const { user_id, guestName } = req.decoded_access_token as TokenPayload
  const payload = pick(req.body, ["orderId", "reviews"])

  await reviewService.createReview({ user_id, user_name: guestName, payload })

  return res.json({
    message: "Gửi đánh giá thành công. Cảm ơn quý khách đã ủng hộ !"
  })
}

export const getReviewsByDishController = async (req: Request, res: Response) => {
  const { dishId } = req.params
  const { page, limit } = paginationQueryParser(req, {
    defaultLimit: 10,
    allowLimits: [10, 20, 30]
  })
  const result = await reviewService.getReviewsByDish({ dishId, page, limit })
  res.status(HTTP_STATUS.OK).json({
    message: "Get all reviews by dish success",
    result
  })
}
