// src/modules/ingredients/ingredient.validations.ts
import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { ErrorWithStatus } from "../../models/Errors"
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
    errorMessage: USER_MESSAGES.SUPPLIER_IDS_MUST_BE_ARRAY
  },
  custom: {
    options: (value: string[]) => {
      if (value.length === 0) return true

      const isAllObjectId = value.every((id) => ObjectId.isValid(id))
      if (!isAllObjectId) {
        throw new Error(USER_MESSAGES.ARRAY_CONTAINS_INVALID_SUPPLIER_ID)
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
    options: { gt: 0 },
    errorMessage: USER_MESSAGES.UNIT_PRICE_MUST_BE_POSITIVE
  },
  toFloat: true
}

const minStockValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.MIN_STOCK_IS_REQUIRED
  },
  isInt: {
    options: { gt: 0 },
    errorMessage: USER_MESSAGES.MIN_STOCK_MUST_BE_POSITIVE_INTEGER
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
      categoryId: {
        optional: true,
        ...categoryIdValidation,
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

export const deleteIngredientValidation = validate(
  checkSchema({
    id: idParamValidation
  })
)
