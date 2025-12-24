import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"

const nameValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.CATEGORY_NAME_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.CATEGORY_NAME_INVALID
  },
  trim: true,
  isLength: {
    options: { min: 1, max: 50 },
    errorMessage: USER_MESSAGES.CATEGORY_NAME_LENGTH
  }
}

const descriptionValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.CATEGORY_DESCRIPTION_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.CATEGORY_DESCRIPTION_INVALID
  },
  trim: true,
  isLength: {
    options: { max: 255 },
    errorMessage: USER_MESSAGES.CATEGORY_DESCRIPTION_LENGTH
  }
}

const statusValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.CATEGORY_STATUS_REQUIRED
  },
  isIn: {
    options: [["active", "inactive"]],
    errorMessage: USER_MESSAGES.CATEGORY_STATUS_INVALID
  }
}

const idParamValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ID_IS_REQUIRED
  },
  isMongoId: {
    errorMessage: new ErrorWithStatus({
      message: USER_MESSAGES.INVALID_MONGODB_ID_FORMAT,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
}

export const createCategoryValidation = validate(
  checkSchema(
    {
      name: nameValidation,
      description: descriptionValidation,
      status: statusValidation
    },
    ["body"]
  )
)

export const updateCategoryValidation = validate(
  checkSchema(
    {
      id: idParamValidation,
      name: {
        optional: true,
        ...nameValidation,
        notEmpty: false
      },
      description: {
        optional: true,
        ...descriptionValidation,
        notEmpty: false
      },
      status: {
        optional: true,
        ...statusValidation,
        notEmpty: false
      }
    },
    ["body", "params"]
  )
)
