import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import { ObjectId } from "mongodb"
import { ReviewStatus } from "../../constants/enums"

const dishIdSchema: ParamSchema = {
  optional: true,
  isMongoId: {
    errorMessage: new ErrorWithStatus({
      message: USER_MESSAGES.INVALID_DISH_ID,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
}

const ratingSchema: ParamSchema = {
  optional: true,
  isInt: {
    options: { min: 1, max: 5 },
    errorMessage: new ErrorWithStatus({
      message: USER_MESSAGES.RATING_MUST_BE_BETWEEN_1_AND_5,
      status: HTTP_STATUS.BAD_REQUEST
    })
  },
  toInt: true
}

const statusSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.STATUS_MUST_BE_STRING
  },
  isIn: {
    options: [Object.values(ReviewStatus)],
    errorMessage: new ErrorWithStatus({
      message: USER_MESSAGES.INVALID_REVIEW_STATUS,
      status: HTTP_STATUS.BAD_REQUEST
    })
  },
  trim: true
}

export const getAllReviewForAdminValidation = validate(
  checkSchema(
    {
      dishId: dishIdSchema,
      rating: ratingSchema,
      status: statusSchema
    },
    ["query"]
  )
)
