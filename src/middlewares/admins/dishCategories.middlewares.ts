// src/modules/dish-categories/dishCategory.validations.ts

import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import { ObjectId } from "mongodb"
import { DishCategoryStatus } from "../../constants/enums"

const nameValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.CATEGORY_NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.CATEGORY_NAME_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: { min: 1, max: 50 },
    errorMessage: USER_MESSAGES.CATEGORY_NAME_LENGTH
  }
}

// Validate cho description
const descriptionValidation: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.CATEGORY_DESCRIPTION_INVALID
  },
  trim: true,
  isLength: {
    options: { max: 255 },
    errorMessage: USER_MESSAGES.CATEGORY_DESCRIPTION_LENGTH
  }
}

// Validate cho image
const imageValidation: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: "Image URL must be a string"
  },
  trim: true
}

// Validate cho displayOrder
const displayOrderValidation: ParamSchema = {
  optional: true,
  isInt: {
    errorMessage: "Display order must be an integer"
  },
  toInt: true
}

// Validate cho status
const statusValidation: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: "Status must be a string"
  },
  isIn: {
    options: [Object.values(DishCategoryStatus)],
    errorMessage: "Status must be either 'Active' or 'Inactive'"
  },
  trim: true
}

// Validate cho Id (Dùng chung)
const idParamValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ID_IS_REQUIRED
  },
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.CATEGORY_ID_INVALID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      return true
    }
  }
}

// Validation cho TẠO MỚI category
export const createDishCategoryValidator = validate(
  checkSchema(
    {
      name: nameValidation,
      description: descriptionValidation,
      image: imageValidation,
      displayOrder: displayOrderValidation,
      status: statusValidation
    },
    ["body"]
  )
)

// Validation cho CẬP NHẬT category
export const updateDishCategoryValidator = validate(
  checkSchema(
    {
      id: idParamValidation,

      name: {
        optional: true,
        ...nameValidation,
        notEmpty: false
      },
      description: {
        ...descriptionValidation,
        optional: true
      },
      image: {
        ...imageValidation,
        optional: true
      },
      displayOrder: {
        ...displayOrderValidation,
        optional: true
      },
      status: {
        ...statusValidation,
        optional: true
      }
    },
    ["body", "params"]
  )
)

export const dishCategoryIdValidator = validate(
  checkSchema(
    {
      id: idParamValidation
    },
    ["params"]
  )
)
