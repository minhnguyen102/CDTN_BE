import { checkSchema } from "express-validator"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"

export const createTableValidation = validate(
  checkSchema(
    {
      capacity: {
        notEmpty: {
          errorMessage: USER_MESSAGES.CAPACITY_REQUIRED
        },
        isInt: {
          options: { gt: 0 },
          errorMessage: USER_MESSAGES.CAPACITY_MUST_BE_POSITIVE_INTEGER
        },
        toInt: true
      }
    },
    ["body"]
  )
)
