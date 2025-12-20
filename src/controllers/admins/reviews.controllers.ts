import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import HTTP_STATUS from "../../constants/httpStatus"
import { paginationQueryParser } from "../../utils/helpers"
import reviewService from "../../services/reviews.services"
import { ReplyReviewReqBody } from "../../models/requests/Review.request"
import { TokenPayload } from "../../models/requests/Account.request"

export const getAllReviewForAdminController = async (req: Request, res: Response) => {
  const { limit, page } = paginationQueryParser(req, { defaultLimit: 15, allowLimits: [15, 20, 25] })
  const status = req.query.status as string
  const rating = Number(req.query.rating)
  const dishId = req.query.dishId as string
  const result = await reviewService.getReviewsForAdmin({ page, limit, status, dishId, rating })
  return res.json({
    message: USER_MESSAGES.GET_ALL_REVIEW_SUCCESS,
    data: result
  })
}

export const changeReviewStatusController = async (req: Request, res: Response) => {
  const { reviewId, status } = req.params
  const result = await reviewService.changeReviewStatus({ reviewId, status })
  res.json({
    message: "Change review status success",
    result
  })
}

export const replyReviewController = async (req: Request<ParamsDictionary, any, ReplyReviewReqBody>, res: Response) => {
  const { reviewId } = req.params
  const { content } = req.body
  const { user_id } = req.decoded_access_token as TokenPayload
  const review = await reviewService.replyReview({ review_id: reviewId, content, admin_id: user_id })

  res.status(HTTP_STATUS.OK).json({
    message: "Reply review success",
    data: review
  })
}
