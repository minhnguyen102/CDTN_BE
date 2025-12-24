import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { ErrorWithStatus } from "../../models/Errors"
import { ObjectId } from "mongodb"

const tableIdSchema: ParamSchema = {
  in: ["body"],
  notEmpty: {
    errorMessage: USER_MESSAGES.TABLE_ID_IS_REQUIRED
  },
  custom: {
    options: (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.TABLE_ID_IS_INVALID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      return true
    }
  }
}

const guestNameSchema: ParamSchema = {
  in: ["body"],
  // optional: true,
  isString: {
    errorMessage: USER_MESSAGES.NAME_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: { min: 1, max: 50 },
    errorMessage: USER_MESSAGES.NAME_LENGTH
  }
}

export const itemsArraySchema: ParamSchema = {
  in: ["body"],
  notEmpty: {
    errorMessage: USER_MESSAGES.ORDER_ITEMS_REQUIRED
  },
  isArray: {
    options: { min: 1 },
    errorMessage: USER_MESSAGES.ORDER_ITEMS_MUST_BE_ARRAY
  }
}

const itemDishIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ORDER_DISH_ID_REQUIRED
  },
  custom: {
    options: (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(USER_MESSAGES.INVALID_DISH_ID_FORMAT)
      }
      return true
    }
  }
}

const itemQuantitySchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ORDER_QUANTITY_REQUIRED
  },
  isInt: {
    options: { gt: 0 },
    errorMessage: USER_MESSAGES.ORDER_QUANTITY_MUST_BE_POSITIVE
  },
  toInt: true
}

const itemNoteSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.ORDER_NOTE_MUST_BE_STRING
  },
  trim: true
}

export const createOrderForTableValidation = validate(
  checkSchema(
    {
      tableId: tableIdSchema,
      guestName: guestNameSchema,
      items: itemsArraySchema,

      "items.*.dishId": itemDishIdSchema,
      "items.*.quantity": itemQuantitySchema,
      "items.*.note": itemNoteSchema
    },
    ["body"]
  )
)

export const getDetailOrderHistoryValidation = validate(
  checkSchema(
    {
      order_id: {
        notEmpty: {
          errorMessage: USER_MESSAGES.ORDER_ID_IS_REQUIRED
        },
        custom: {
          options: (value: string) => {
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
    },
    ["params"]
  )
)

export const adminCreateOrderValidation = validate(checkSchema({}))
