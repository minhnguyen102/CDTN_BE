import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { ErrorWithStatus } from "../../models/Errors"
import { TableStatus } from "../../constants/enums"

const capacityValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.CAPACITY_REQUIRED
  },
  isInt: {
    options: { gt: 0 },
    errorMessage: USER_MESSAGES.CAPACITY_MUST_BE_POSITIVE_INTEGER
  },
  toInt: true
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

export const createTableValidation = validate(
  checkSchema(
    {
      capacity: capacityValidation
    },
    ["body"]
  )
)

export const updateTableValidation = validate(
  checkSchema(
    {
      id: idParamValidation,
      capacity: {
        optional: true,
        ...capacityValidation,
        notEmpty: false
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(TableStatus)],
          errorMessage: "Status must be one of the following: Available, Occupied, Reserved, or Needs_cleaning."
        },
        toInt: true
      }
    },
    ["body", "params"]
  )
)

export const regenerateQrTokenValidation = validate(
  checkSchema(
    {
      id: idParamValidation
    },
    ["params"]
  )
)
