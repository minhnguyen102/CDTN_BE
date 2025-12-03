import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"

const nameValidation: ParamSchema = {
  notEmpty: {
    errorMessage: "Name is required"
  },
  isString: {
    errorMessage: "Name must be a string"
  },
  trim: true,
  isLength: {
    options: { min: 1, max: 50 },
    errorMessage: "Name length must be between 1 and 50 chars"
  }
}
const qrTokenValidation: ParamSchema = {
  notEmpty: {
    errorMessage: "QR Token is required"
  },
  isString: {
    errorMessage: "QR Token must be a string"
  }
}
export const guestLoginValidation = validate(
  checkSchema(
    {
      name: nameValidation,
      qrToken: qrTokenValidation
    },
    ["body"]
  )
)
