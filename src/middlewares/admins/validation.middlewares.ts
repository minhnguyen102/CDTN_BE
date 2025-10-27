import { checkSchema } from "express-validator"
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
        notEmpty: true
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
