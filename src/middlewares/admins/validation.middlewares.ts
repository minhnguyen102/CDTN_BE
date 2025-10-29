import { check, checkSchema } from "express-validator"
import HTTP_STATUS from "~/constants/httpStatus"
import USER_MESSAGES from "~/constants/message"
import { ErrorWithStatus } from "~/models/Errors"
import databaseService from "~/services/database.servies"
import { hashPassword } from "~/utils/crypto"
import { validate } from "~/utils/validation"
import { Request } from "express"
import { verifyToken } from "~/utils/jwt"
import { JsonWebTokenError } from "jsonwebtoken"
import _ from "lodash"
import { TokenType } from "~/constants/enums"

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

export const accessTokenValidation = validate(
  checkSchema(
    {
      authorization: {
        custom: {
          options: async (value, { req }) => {
            try {
              const access_token = (value || "").split(" ")[1]
              if (!access_token) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              // decoded
              const decoded_access_token = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.PRIVATE_KEY_SIGN_ACCESS_TOKEN as string
              })
              req.decoded_access_token = decoded_access_token
              // console.log(decoded_access_token)
            } catch (error) {
              // Lỗi do verify
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: _.capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error // bắt lỗi !access_token bên trên và throw sang cho vòng tiếp theo xử lí
            }
            return true
          }
        }
      }
    },
    ["headers"]
  )
)

export const refreshTokenValidation = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: new ErrorWithStatus({
            message: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        },
        custom: {
          options: async (value, { req }) => {
            try {
              const [decoded_refresh_token, isExistRefreshToken] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.PRIVATE_KEY_SIGN_REFRESH_TOKEN as string }),
                databaseService.refresh_tokens.findOne({ token: value })
              ])

              if (!isExistRefreshToken) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
              // console.log(decoded_refresh_token)
            } catch (error) {
              // Lỗi do verify
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: _.capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ["body"]
  )
)

export const emailVerifyTokenValidation = validate(
  checkSchema(
    {
      email_verify_token: {
        notEmpty: {
          errorMessage: new ErrorWithStatus({
            message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.BAD_REQUEST
          })
        },
        custom: {
          options: async (value, { req }) => {
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.PRIVATE_KEY_SIGN_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
              // console.log(decoded_email_verify_token)
            } catch (error) {
              // Lỗi do verify: Tạm để như này
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: _.capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ["body"]
  )
)
