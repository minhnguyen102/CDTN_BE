import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import HTTP_STATUS from "../../constants/httpStatus"
import { paginationQueryParser } from "../../utils/helpers"
import reviewService from "../../services/reviews.services"

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
