import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import { JsonWebTokenError } from "jsonwebtoken"
import { verifyToken } from "../../utils/jwt"
import _ from "lodash"
import { ROLE_GUEST } from "../../constants/enums"
import { ObjectId } from "mongodb"

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

// VALIDATE CREATE ORDER
const itemsArrayValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ORDER_ITEMS_REQUIRED
  },
  isArray: {
    errorMessage: USER_MESSAGES.ORDER_ITEMS_MUST_BE_ARRAY,
    options: { min: 1 }
  },
  custom: {
    // Custom check thêm nếu cần (ví dụ check duplicate dishId)
    options: (value: any[]) => {
      if (value.length === 0) {
        throw new Error(USER_MESSAGES.ORDER_ITEMS_EMPTY)
      }
      return true
    }
  }
}

// Validate Dish ID (cho từng item)
const itemDishIdValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ORDER_DISH_ID_REQUIRED
  },
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.ORDER_DISH_ID_INVALID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      return true
    }
  }
}

// Validate Quantity (cho từng item)
const itemQuantityValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ORDER_QUANTITY_REQUIRED
  },
  isInt: {
    options: { gt: 0 }, // Phải là số nguyên > 0
    errorMessage: USER_MESSAGES.ORDER_QUANTITY_MUST_BE_POSITIVE
  },
  toInt: true // Tự động convert string "2" thành number 2
}

// Validate Note (cho từng item - Optional)
const itemNoteValidation: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.ORDER_NOTE_MUST_BE_STRING
  },
  trim: true
}

export const createOrderValidation = validate(
  checkSchema(
    {
      // Kiểm tra mảng items
      items: itemsArrayValidation,

      // Kiểm tra chi tiết từng phần tử trong mảng items (Wildcard *)
      "items.*.dishId": itemDishIdValidation,

      "items.*.quantity": itemQuantityValidation,

      "items.*.note": itemNoteValidation
    },
    ["body"]
  )
)
