import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import { ReviewStatus } from "../../constants/enums"

const IdSchema: ParamSchema = {
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
      dishId: IdSchema,
      rating: ratingSchema,
      status: statusSchema
    },
    ["query"]
  )
)

export const changeReviewStatusValidation = validate(
  checkSchema({
    reviewId: {
      ...IdSchema,
      optional: false,
      notEmpty: {
        errorMessage: USER_MESSAGES.REVIEW_ID_IS_REQUIRED
      }
    },
    status: {
      ...statusSchema,
      notEmpty: {
        errorMessage: USER_MESSAGES.STATUS_IS_REQUIRED
      }
    }
  })
)

export const replyReviewValidation = validate(
  checkSchema({
    reviewId: {
      ...IdSchema,
      notEmpty: {
        errorMessage: USER_MESSAGES.REVIEW_ID_IS_REQUIRED
      }
    },
    content: {
      notEmpty: {
        errorMessage: USER_MESSAGES.CONTENT_REPLY_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.CONTENT_MUST_BE_STRING
      }
    }
  })
)
