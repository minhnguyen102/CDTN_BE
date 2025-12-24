import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { ErrorWithStatus } from "../../models/Errors"
import { RoleStatus } from "../../constants/enums"
import { isMongoId } from "validator"
import databaseService from "../../services/database.servies"
import { ObjectId } from "mongodb"

const roleIdValidate: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ROLE_ID_IS_REQUIRED
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
    errorMessage: USER_MESSAGES.ROLE_NAME_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.ROLE_NAME_MUST_BE_STRING
  },
  custom: {
    options: async (value: string) => {
      const role = await databaseService.roles.findOne({ name: value })

      if (role) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.ROLE_NAME_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT
        })
      }

      return true
    }
  },
  trim: true
}

const descriptionValidation: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.ROLE_DESCRIPTION_MUST_BE_STRING
  },
  trim: true
}

const statusValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ROLE_STATUS_REQUIRED
  },
  isIn: {
    options: [Object.values(RoleStatus)],
    errorMessage: USER_MESSAGES.INVALID_ROLE_STATUS
  }
}

const permissionIdsValidation: ParamSchema = {
  exists: {
    errorMessage: USER_MESSAGES.ROLE_PERMISSION_IDS_REQUIRED
  },
  isArray: {
    errorMessage: USER_MESSAGES.ROLE_PERMISSION_IDS_MUST_BE_ARRAY
  },
  custom: {
    options: async (value: any[]) => {
      if (!Array.isArray(value)) {
        throw new Error(USER_MESSAGES.ROLE_PERMISSION_IDS_MUST_BE_ARRAY)
      }
      if (value.length === 0) {
        return true
      }

      for (const id of value) {
        if (!isMongoId(String(id))) {
          throw new ErrorWithStatus({
            message: `${USER_MESSAGES.INVALID_MONGODB_ID_FORMAT}: ${id}`,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
      }

      const objectIdArray = value.map((id) => new ObjectId(String(id)))
      const count = await databaseService.permissions.countDocuments({
        _id: { $in: objectIdArray }
      })

      if (objectIdArray.length > count) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.PERMISSION_ID_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      return true
    }
  }
}

export const createRoleValidation = validate(
  checkSchema(
    {
      name: nameValidation,
      description: descriptionValidation,
      status: statusValidation,
      permissionIds: permissionIdsValidation
    },
    ["body"]
  )
)

export const updateRoleValidation = validate(
  checkSchema(
    {
      role_id: roleIdValidate,
      name: {
        optional: true,
        ...nameValidation,
        notEmpty: false,
        custom: {
          options: async (value: string, { req }) => {
            const role_id = req.params?.role_id

            const roleBeingUpdated = await databaseService.roles.findOne({
              _id: new ObjectId(String(role_id))
            })

            if (!roleBeingUpdated) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ROLE_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            const role = await databaseService.roles.findOne({
              name: value,
              _id: { $ne: new ObjectId(String(role_id)) }
            })

            if (role) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ROLE_NAME_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              })
            }
            return true
          }
        }
      },
      description: descriptionValidation,
      status: {
        optional: true,
        ...statusValidation,
        notEmpty: false
      },
      permissionIds: {
        optional: true,
        ...permissionIdsValidation,
        exists: false
      }
    },
    ["body", "params"]
  )
)

export const roleIdValidation = validate(
  checkSchema(
    {
      role_id: roleIdValidate
    },
    ["params"]
  )
)
