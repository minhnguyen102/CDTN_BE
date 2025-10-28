import { checkSchema } from "express-validator"
import HTTP_STATUS from "~/constants/httpStatus"
import USER_MESSAGES from "~/constants/message"
import ErrorWithStatus from "~/models/Errors"
import databaseService from "~/services/database.servies"
import { validate } from "~/utils/validation"

export const registerValidation = validate(
  checkSchema(
    {
      name: {
        notEmpty: true,
        isString: true,
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          }
        }
      },
      email: {
        isEmail: true,
        trim: true,
        notEmpty: true,
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
        notEmpty: true,
        isString: true,
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1
          }
        }
      },
      confirm_password: {
        notEmpty: true,
        isString: true,
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1
          }
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error("Confirm password does not match password")
            }
            return true
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          }
        }
      }
    },
    ["body"]
  )
)
