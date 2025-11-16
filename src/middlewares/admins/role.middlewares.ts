import { Request } from "express"
import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../../utils/validation"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { ErrorWithStatus } from "../../models/Errors"
import { RoleStatus } from "../../constants/enums" // Giả sử bạn có enum này
import { isMongoId } from "validator" // Import trực tiếp để dùng trong custom validation
import databaseService from "../../services/database.servies"
import { ObjectId } from "mongodb"

const roleIdValidate: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ROLE_ID_IS_REQUIRED // Cần thêm message này
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
    errorMessage: USER_MESSAGES.ROLE_NAME_REQUIRED // Cần thêm message này
  },
  isString: {
    errorMessage: USER_MESSAGES.ROLE_NAME_MUST_BE_STRING // Cần thêm message này
  },
  custom: {
    options: async (value: string) => {
      const role = await databaseService.roles.findOne({ name: value })

      if (role) {
        // Nếu tìm thấy role, nghĩa là name đã tồn tại -> ném lỗi
        throw new ErrorWithStatus({
          message: USER_MESSAGES.ROLE_NAME_ALREADY_EXISTS, // Cần thêm message này
          status: HTTP_STATUS.CONFLICT // 409 Conflict là status code phù hợp
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
    errorMessage: USER_MESSAGES.ROLE_DESCRIPTION_MUST_BE_STRING // Cần thêm message này
  },
  trim: true
}

const statusValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ROLE_STATUS_REQUIRED // Cần thêm message này
  },
  isIn: {
    options: [Object.values(RoleStatus)],
    errorMessage: USER_MESSAGES.INVALID_ROLE_STATUS // Cần thêm message này
  }
}

const permissionIdsValidation: ParamSchema = {
  // Phải tồn tại (có thể là mảng rỗng, nhưng không được thiếu)
  exists: {
    errorMessage: USER_MESSAGES.ROLE_PERMISSION_IDS_REQUIRED // Cần thêm
  },
  isArray: {
    errorMessage: USER_MESSAGES.ROLE_PERMISSION_IDS_MUST_BE_ARRAY // Cần thêm
  },
  custom: {
    options: async (value: any[]) => {
      if (!Array.isArray(value)) {
        throw new Error(USER_MESSAGES.ROLE_PERMISSION_IDS_MUST_BE_ARRAY)
      }
      if (value.length === 0) {
        return true
      }
      // Kiểm tra từng ID trong mảng
      for (const id of value) {
        if (!isMongoId(String(id))) {
          // Báo lỗi ngay lập tức nếu tìm thấy 1 ID không hợp lệ
          throw new ErrorWithStatus({
            message: `${USER_MESSAGES.INVALID_MONGODB_ID_FORMAT}: ${id}`,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
      }
      // Kiểm tra tồn tại trong db permissions
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

// --- Xuất các middleware validation ---

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
          // ghi đè custom bên trên
          options: async (value: string, { req }) => {
            const role_id = req.params?.role_id

            const roleBeingUpdated = await databaseService.roles.findOne({
              _id: new ObjectId(String(role_id))
            })

            // nếu là id ma => roleBeingUpdated = null
            if (!roleBeingUpdated) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ROLE_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // Kiểm tra xem có trùng tên với các role đã tồn tại rồi hay không
            const role = await databaseService.roles.findOne({
              name: value,
              _id: { $ne: new ObjectId(String(role_id)) }
            })
            // console.log("role", role)

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
        exists: false // Ghi đè exists để cho phép bỏ qua
      }
    },
    ["body", "params"]
  )
)

// Dùng cho GET /:role_id và DELETE /:role_id
export const roleIdValidation = validate(
  checkSchema(
    {
      role_id: roleIdValidate
    },
    ["params"]
  )
)
