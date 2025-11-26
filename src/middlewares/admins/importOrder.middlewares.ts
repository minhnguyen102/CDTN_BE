// src/modules/import-orders/importOrder.validations.ts
import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { ErrorWithStatus } from "../../models/Errors"
import { ImportOrderStatus } from "../../constants/enums"
import { ObjectId } from "mongodb"

// Validation cho ID (dùng chung)
const mongoIdSchema = (errorMessage: string): ParamSchema => ({
  notEmpty: {
    errorMessage: "ID is required" // Sẽ được ghi đè bởi message cụ thể
  },
  isMongoId: {
    errorMessage: new ErrorWithStatus({
      message: errorMessage,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
})

export const createImportOrderValidation = validate(
  checkSchema(
    {
      supplierId: {
        ...mongoIdSchema(USER_MESSAGES.SUPPLIER_ID_INVALID),
        errorMessage: USER_MESSAGES.SUPPLIER_ID_IS_REQUIRED
      },
      importDate: {
        notEmpty: {
          errorMessage: USER_MESSAGES.IMPORT_DATE_IS_REQUIRED
        },
        isISO8601: {
          errorMessage: USER_MESSAGES.IMPORT_DATE_INVALID
        },
        toDate: true // Tự động chuyển đổi chuỗi thành Date
      },
      status: {
        notEmpty: {
          errorMessage: USER_MESSAGES.STATUS_IS_REQUIRED
        },
        isIn: {
          options: [Object.values(ImportOrderStatus)],
          errorMessage: USER_MESSAGES.STATUS_INVALID
        }
      },
      items: {
        notEmpty: {
          errorMessage: USER_MESSAGES.ITEMS_ARE_REQUIRED
        },
        isArray: {
          errorMessage: USER_MESSAGES.ITEMS_MUST_BE_ARRAY,
          options: { min: 1 } // Phải có ít nhất 1 item
        }
      },
      // Kiểm tra từng object BÊN TRONG mảng 'items'
      "items.*.ingredientId": {
        ...mongoIdSchema(USER_MESSAGES.ITEM_INGREDIENT_ID_INVALID),
        errorMessage: USER_MESSAGES.ITEM_INGREDIENT_ID_IS_REQUIRED
      },
      "items.*.quantity": {
        notEmpty: {
          errorMessage: USER_MESSAGES.ITEM_QUANTITY_IS_REQUIRED
        },
        isFloat: {
          options: { gt: 0 },
          errorMessage: USER_MESSAGES.ITEM_QUANTITY_MUST_BE_POSITIVE
        },
        toFloat: true
      },
      "items.*.importPrice": {
        notEmpty: {
          errorMessage: USER_MESSAGES.ITEM_IMPORT_PRICE_IS_REQUIRED
        },
        isFloat: {
          options: { min: 0 }, // Giá có thể bằng 0 (hàng tặng)
          errorMessage: USER_MESSAGES.ITEM_IMPORT_PRICE_MUST_BE_POSITIVE
        },
        toFloat: true
      },
      taxRate: {
        optional: true,
        isFloat: {
          options: { min: 0 },
          errorMessage: USER_MESSAGES.TAX_RATE_MUST_BE_POSITIVE
        },
        toFloat: true
      },
      notes: {
        optional: true,
        isString: true,
        trim: true
      }
    },
    ["body"]
  )
)

export const importOrderIdValidator = validate(
  checkSchema(
    {
      id: {
        in: ["params"],
        trim: true,
        custom: {
          options: async (value: string) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.INVALID_MONGODB_ID_FORMAT,
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

export const changeImportOrderStatusValidator = validate(
  checkSchema(
    {
      id: { ...mongoIdSchema, errorMessage: "" },
      status: {
        trim: true,
        custom: {
          options: (value: string) => {
            // YÊU CẦU: Chỉ cho phép chuyển sang 'confirmed'
            if (value !== ImportOrderStatus.CONFIRMED) {
              throw new ErrorWithStatus({
                message: "Only 'confirmed' status is accepted for this action",
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
