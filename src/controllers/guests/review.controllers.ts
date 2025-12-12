import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { CreateReviewReqBody } from "../../models/requests/Review.request"
import { TokenPayload } from "../../models/requests/Account.request"
import { pick } from "lodash"
import reviewService from "../../services/reviews.services"
import USER_MESSAGES from "../../constants/message"

export const createReviewController = async (
  req: Request<ParamsDictionary, any, CreateReviewReqBody>,
  res: Response
) => {
  const { user_id, guestName } = req.decoded_access_token as TokenPayload
  const payload = pick(req.body, ["comment", "dishId", "orderId", "rating"])

  const result = await reviewService.createReview({ user_id, user_name: guestName, payload })

  return res.json({
    message: USER_MESSAGES.REVIEW_POSTED_SUCCESSFULLY,
    result
  })
}
