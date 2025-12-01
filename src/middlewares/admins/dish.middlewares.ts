import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import { ObjectId } from "mongodb"
import { DishStatus } from "../../constants/enums"

const nameValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.DISH_NAME_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.DISH_NAME_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: { min: 1, max: 200 },
    errorMessage: USER_MESSAGES.DISH_NAME_LENGTH
  }
}

const priceValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.DISH_PRICE_REQUIRED
  },
  isFloat: {
    options: { min: 0 },
    errorMessage: USER_MESSAGES.DISH_PRICE_MUST_BE_POSITIVE
  },
  toFloat: true
}

const descriptionValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.DISH_DESCRIPTION_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.DISH_DESCRIPTION_MUST_BE_STRING
  },
  trim: true
}

const statusValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.DISH_STATUS_REQUIRED
  },
  isIn: {
    options: [Object.values(DishStatus)],
    errorMessage: USER_MESSAGES.DISH_STATUS_INVALID
  }
}

const categoryIdValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.DISH_CATEGORY_REQUIRED
  },
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.DISH_CATEGORY_INVALID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      return true
    }
  }
}

const recipeValidation: ParamSchema = {
  customSanitizer: {
    options: (value) => {
      // Nếu là string (do gửi form-data), thử parse nó ra JSON
      if (typeof value === "string") {
        try {
          return JSON.parse(value)
        } catch (error) {
          // Nếu parse lỗi, trả về nguyên bản để các validator sau bắt lỗi
          return value
        }
      }
      return value
    }
  },
  notEmpty: {
    errorMessage: USER_MESSAGES.DISH_RECIPE_REQUIRED
  },
  isArray: {
    errorMessage: USER_MESSAGES.DISH_RECIPE_MUST_BE_ARRAY,
    options: { min: 1 }
  }
}

const imageRequiredValidation: ParamSchema = {
  custom: {
    options: (value, { req }) => {
      if (!req.file) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.DISH_IMAGE_REQUIRED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
      if (!validTypes.includes(req.file.mimetype)) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.FILE_TYPE_NOT_SUPPORTED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      return true
    }
  }
}

const imageOptionalValidation: ParamSchema = {
  custom: {
    options: (value, { req }) => {
      if (!req.file) return true

      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
      if (!validTypes.includes(req.file.mimetype)) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.FILE_TYPE_NOT_SUPPORTED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      return true
    }
  }
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

// Validation cho CREATE DISH
export const createDishValidation = validate(
  checkSchema(
    {
      name: nameValidation,
      price: priceValidation,
      status: statusValidation,
      description: descriptionValidation,
      categoryId: categoryIdValidation,
      image: imageRequiredValidation,

      recipe: recipeValidation,

      // Validate chi tiết từng phần tử trong mảng recipe
      "recipe.*.ingredientId": {
        notEmpty: { errorMessage: USER_MESSAGES.RECIPE_INGREDIENT_ID_REQUIRED },
        custom: {
          options: async (value: string) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.RECIPE_INGREDIENT_ID_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      },
      "recipe.*.quantity": {
        notEmpty: { errorMessage: USER_MESSAGES.RECIPE_QUANTITY_REQUIRED },
        isFloat: {
          options: { gt: 0 },
          errorMessage: USER_MESSAGES.RECIPE_QUANTITY_MUST_BE_POSITIVE
        },
        toFloat: true
      },

      isFeatured: {
        optional: true,
        isBoolean: true,
        toBoolean: true
      }
    },
    ["body"]
  )
)

// Validation cho UPDATE DISH
export const updateDishValidation = validate(
  checkSchema(
    {
      id: idParamValidation,

      name: {
        optional: true,
        ...nameValidation,
        notEmpty: false
      },
      price: {
        optional: true,
        ...priceValidation,
        notEmpty: false
      },
      status: {
        optional: true,
        ...statusValidation,
        notEmpty: false
      },
      categoryId: {
        optional: true,
        ...categoryIdValidation,
        notEmpty: false
      },
      description: {
        optional: true,
        ...descriptionValidation,
        notEmpty: false
      },
      image: {
        optional: true,
        ...imageOptionalValidation
      },
      recipe: {
        optional: true,
        ...recipeValidation,
        notEmpty: false
      },
      "recipe.*.ingredientId": {
        optional: true,
        custom: {
          options: async (value: string) => {
            if (value && !ObjectId.isValid(value)) {
              throw new Error(USER_MESSAGES.RECIPE_INGREDIENT_ID_INVALID)
            }
            return true
          }
        }
      },
      "recipe.*.quantity": {
        optional: true,
        isFloat: {
          options: { gt: 0 },
          errorMessage: USER_MESSAGES.RECIPE_QUANTITY_MUST_BE_POSITIVE
        },
        toFloat: true
      },
      isFeatured: {
        optional: true,
        isBoolean: true,
        toBoolean: true
      }
    },
    ["body", "params"]
  )
)
