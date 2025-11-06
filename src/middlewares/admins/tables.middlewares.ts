import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"
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

export const createTableValidation = validate(
  checkSchema(
    {
      capacity: capacityValidation
    },
    ["body"]
  )
)

export const updateTableValidation = validate(
  checkSchema({
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
  })
)
