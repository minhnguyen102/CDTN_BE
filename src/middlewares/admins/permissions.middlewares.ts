import { checkSchema, ParamSchema } from "express-validator"
import { ObjectId } from "mongodb"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { ErrorWithStatus } from "../../models/Errors"
import databaseService from "../../services/database.servies"

const permissionIdValidate: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.PERMISSION_ID_IS_REQUIRED
  },
  isMongoId: {
    errorMessage: new ErrorWithStatus({
      message: USER_MESSAGES.INVALID_MONGODB_ID_FORMAT,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
}

const nameValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.PERMISSION_NAME_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.PERMISSION_NAME_MUST_BE_STRING
  },
  trim: true
}

const descriptionValidation: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.PERMISSION_DESCRIPTION_MUST_BE_STRING
  },
  trim: true
}

const moduleValidation: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.PERMISSION_MODULE_MUST_BE_STRING
  },
  trim: true
}

export const createPermissionValidation = validate(
  checkSchema(
    {
      name: {
        ...nameValidation,
        custom: {
          options: async (value: string) => {
            const permission = await databaseService.permissions.findOne({ name: value })
            if (permission) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.PERMISSION_NAME_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              })
            }
            return true
          }
        }
      },
      description: descriptionValidation,
      module: moduleValidation
    },
    ["body"]
  )
)

export const updatePermissionValidation = validate(
  checkSchema(
    {
      permission_id: permissionIdValidate,
      name: {
        optional: true,
        ...nameValidation,
        notEmpty: false,
        custom: {
          options: async (value: string, { req }) => {
            const permission_id = req.params?.permission_id
            const permission = await databaseService.permissions.findOne({
              name: value,
              _id: { $ne: new ObjectId(String(permission_id)) }
            })

            if (permission) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.PERMISSION_NAME_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              })
            }
            return true
          }
        }
      },
      description: descriptionValidation,
      module: moduleValidation
    },
    ["body", "params"]
  )
)

export const permissionIdValidation = validate(
  checkSchema(
    {
      permission_id: permissionIdValidate
    },
    ["params"]
  )
)
