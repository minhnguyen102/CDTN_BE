import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import { JsonWebTokenError } from "jsonwebtoken"
import { verifyToken } from "../../utils/jwt"
import _ from "lodash"
import { ROLE_GUEST } from "../../constants/enums"

const guestNameValidation: ParamSchema = {
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
      guestName: guestNameValidation,
      qrToken: qrTokenValidation
    },
    ["body"]
  )
)

export const accessTokenValidation = validate(
  checkSchema({
    authorization: {
      custom: {
        options: async (value, { req }) => {
          try {
            const access_token = (value || "").split(" ")[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            // decoded
            const decoded_access_token = await verifyToken({
              token: access_token,
              secretOrPublicKey: process.env.PRIVATE_KEY_SIGN_ACCESS_TOKEN as string
            })
            if (decoded_access_token.role !== ROLE_GUEST) {
              throw new ErrorWithStatus({
                message: "You are not authorized (Guest role required)",
                status: HTTP_STATUS.FORBIDDEN
              })
            }
            req.decoded_access_token = decoded_access_token
            // console.log("decoded_access_token", decoded_access_token)
          } catch (error) {
            // Lỗi do verify
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({
                message: _.capitalize(error.message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            throw error // bắt lỗi !access_token bên trên và throw sang cho vòng tiếp theo xử lí
          }
          return true
        }
      }
    }
  })
)
