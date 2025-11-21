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

// Logic kiểm tra định dạng file (Dùng chung)
const checkImageFormat = (file: Express.Multer.File) => {
  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
  if (!validTypes.includes(file.mimetype)) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.FILE_TYPE_NOT_SUPPORTED,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
  return true
}

// Validate cho CREATE (Bắt buộc phải có ảnh)
const imageRequiredValidation: ParamSchema = {
  custom: {
    options: (value, { req }) => {
      if (!req.file) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.IMAGE_REQUIRED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      return checkImageFormat(req.file)
    }
  }
}

// Validate cho UPDATE (Không bắt buộc, chỉ check nếu có file)
const imageOptionalValidation: ParamSchema = {
  custom: {
    options: (value, { req }) => {
      // Nếu không có file -> Cho qua (return true) để giữ ảnh cũ
      if (!req.file) {
        return true
      }
      // Nếu có file -> Check định dạng
      return checkImageFormat(req.file)
    }
  }
}

// Validate cho displayOrder
const displayOrderValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.DISPLAY_ORDER_REQUIRED
  },
  isInt: {
    options: { min: 1 },
    errorMessage: USER_MESSAGES.DISPLAY_ORDER_INTEGER
  },
  toInt: true
}

// Validate cho status
const statusValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.STATUS_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.DISPAY_ORDER_STATUS_INVALID
  },
  isIn: {
    options: [Object.values(DishCategoryStatus)],
    errorMessage: USER_MESSAGES.DISPAY_ORDER_STATUS
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
      display_order: displayOrderValidation,
      status: statusValidation,
      image: imageRequiredValidation
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
      description: descriptionValidation,
      image: imageOptionalValidation,
      display_order: {
        ...displayOrderValidation,
        notEmpty: false,
        optional: true
      },
      status: {
        ...statusValidation,
        notEmpty: false,
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
