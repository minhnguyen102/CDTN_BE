import { checkSchema } from "express-validator"
import HTTP_STATUS from "~/constants/httpStatus"
import USER_MESSAGES from "~/constants/message"
import { ErrorWithStatus } from "~/models/Errors"
import databaseService from "~/services/database.servies"
import { hashPassword } from "~/utils/crypto"
import { validate } from "~/utils/validation"
import { Request } from "express"

export const registerValidation = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.NAME_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USER_MESSAGES.NAME_LENGTH
        }
      },
      email: {
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        trim: true,
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            const isEmailExits = await databaseService.accounts.findOne({ email: value })
            if (isEmailExits) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              })
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1
          },
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USER_MESSAGES.PASSWORDS_DO_NOT_MATCH)
            }
            return true
          }
        }
      },
      date_of_birth: {
        notEmpty: {
          errorMessage: USER_MESSAGES.DATE_OF_BIRTH_IS_REQUIRED
        },
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      }
    },
    ["body"]
  )
)

export const loginValidation = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        trim: true,
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            const account = await databaseService.accounts.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            // Nếu không tồn tại user trong db => throw lỗi
            // console.log(account)
            if (!account) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            req.account = account
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1
          },
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ["body"]
  )
)
