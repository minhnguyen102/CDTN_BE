// src/modules/ingredients/ingredient.validations.ts
import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../../utils/validation" // (Giả định)
import USER_MESSAGES from "../../constants/message" // (Giả định)
import HTTP_STATUS from "../../constants/httpStatus" // (Giả định)
import { ErrorWithStatus } from "../../models/Errors" // (Giả định)
import { ObjectId } from "mongodb"

const nameValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.INGREDIENT_NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.INGREDIENT_NAME_MUST_BE_STRING
  },
  isLength: {
    options: { min: 2 },
    errorMessage: USER_MESSAGES.INGREDIENT_NAME_MIN_LENGTH
  },
  trim: true
}

const categoryIdValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.CATEGORY_ID_IS_REQUIRED
  },
  isMongoId: {
    errorMessage: new ErrorWithStatus({
      message: USER_MESSAGES.CATEGORY_ID_INVALID,
      status: HTTP_STATUS.BAD_REQUEST
    })
  },
  trim: true
}

const unitValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.UNIT_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.UNIT_MUST_BE_STRING
  },
  trim: true
}

const supplierIdsValidation: ParamSchema = {
  optional: true,
  isArray: {
    errorMessage: "Supplier IDs must be an array"
  },
  custom: {
    options: (value: string[]) => {
      if (value.length === 0) return true

      const isAllObjectId = value.every((id) => ObjectId.isValid(id))
      if (!isAllObjectId) {
        throw new Error("Array contains invalid Supplier ID")
      }
      return true
    }
  }
}

const unitPriceValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.UNIT_PRICE_IS_REQUIRED
  },
  isFloat: {
    // Dùng isFloat để chấp nhận cả số nguyên và số thập phân
    options: { gt: 0 }, // Phải lớn hơn 0
    errorMessage: USER_MESSAGES.UNIT_PRICE_MUST_BE_POSITIVE
  },
  toFloat: true
}

const minStockValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.MIN_STOCK_IS_REQUIRED
  },
  isInt: {
    options: { gt: 0 }, // Tồn kho tối thiểu bằng 0 là hợp lệ
    errorMessage: USER_MESSAGES.MIN_STOCK_MUST_BE_POSITIVE_INTEGER
  },
  toInt: true // Tự động chuyển đổi
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

export const createIngredientValidation = validate(
  checkSchema(
    {
      name: nameValidation,
      categoryId: categoryIdValidation,
      unit: unitValidation,
      minStock: minStockValidation,
      supplierIds: supplierIdsValidation
    },
    ["body"]
  )
)

export const updateIngredientValidation = validate(
  checkSchema(
    {
      id: idParamValidation,

      name: {
        optional: true,
        ...nameValidation,
        notEmpty: false
      },
      categoryId: {
        optional: true,
        ...categoryIdValidation,
        notEmpty: false
      },
      unit: {
        optional: true,
        ...unitValidation,
        notEmpty: false
      },
      unitPrice: {
        optional: true,
        ...unitPriceValidation,
        notEmpty: false
      },
      minStock: {
        optional: true,
        ...minStockValidation,
        notEmpty: false
      },
      supplierIds: supplierIdsValidation
    },
    ["params", "body"]
  )
)
