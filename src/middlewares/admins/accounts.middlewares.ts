import { checkSchema, ParamSchema } from "express-validator"
import HTTP_STATUS from "../../constants/httpStatus"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import databaseService from "../../services/database.servies"
import { hashPassword } from "../../utils/crypto"
import { validate } from "../../utils/validation"
import { NextFunction, Request, Response } from "express"
import { verifyToken } from "../../utils/jwt"
import { JsonWebTokenError } from "jsonwebtoken"
import _ from "lodash"
import { ObjectId } from "mongodb"
import { TokenPayload } from "../../models/requests/Account.request"
import { AccountStatus, AccountVerifyStatus, MESSAGE_CODES, RoleAccount } from "../../constants/enums"

const nameValidation: ParamSchema = {
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
}

const passwordValidation: ParamSchema = {
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
export const phoneValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.PHONE_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.PHONE_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: { min: 10, max: 11 },
    errorMessage: USER_MESSAGES.PHONE_LENGTH_MUST_BE_FROM_10_TO_11
  },
  isMobilePhone: {
    options: ["vi-VN"],
    errorMessage: USER_MESSAGES.PHONE_IS_INVALID
  }
}

export const statusValidation: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.STATUS_MUST_BE_STRING
  },
  trim: true,
  isIn: {
    options: [Object.values(AccountStatus)],
    errorMessage: `${USER_MESSAGES.STATUS_IS_INVALID}. Các trạng thái cho phép: ${Object.values(AccountStatus).join(", ")}`
  }
}

const confirmPasswordValidation: ParamSchema = {
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
}

const dateOfBirthValidation: ParamSchema = {
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

export const registerValidation = validate(
  checkSchema(
    {
      name: nameValidation,
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
      // password: passwordValidation,
      phone: phoneValidation,
      status: statusValidation,
      // confirm_password: confirmPasswordValidation,
      date_of_birth: dateOfBirthValidation
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
      password: passwordValidation
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
              // console.log("decoded_access_token", decoded_access_token)
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
              // Lỗi do verify:
              // throw new ErrorWithStatus({
              //   message: _.capitalize((error as JsonWebTokenError).message),
              //   status: HTTP_STATUS.UNAUTHORIZED
              // })
              if (error instanceof JsonWebTokenError) {
                // Trường hợp hết hạn
                if (error.name === "TokenExpiredError") {
                  throw new ErrorWithStatus({
                    message: "Token expired, please resend",
                    status: HTTP_STATUS.UNAUTHORIZED,
                    code: MESSAGE_CODES.EMAIL_TOKEN_EXPIRED
                  })
                }

                // Trường hợp sai chữ ký / token rác
                throw new ErrorWithStatus({
                  message: "Invalid token",
                  status: HTTP_STATUS.UNAUTHORIZED,
                  code: MESSAGE_CODES.INVALID_TOKEN
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

export const resendEmailVerifyTokenValidation = validate(
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
                secretOrPublicKey: process.env.PRIVATE_KEY_SIGN_EMAIL_VERIFY_TOKEN as string,
                options: { ignoreExpiration: true }
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
              // console.log(decoded_email_verify_token)
            } catch (error) {
              // // Lỗi do verify:
              // throw new ErrorWithStatus({
              //   message: _.capitalize((error as JsonWebTokenError).message),
              //   status: HTTP_STATUS.UNAUTHORIZED,
              //   code: MESSAGE_CODES.EMAIL_TOKEN_EXPIRED
              // })

              if (error instanceof JsonWebTokenError) {
                // Trường hợp hết hạn
                if (error.name === "TokenExpiredError") {
                  throw new ErrorWithStatus({
                    message: "Token expired, please resend",
                    status: HTTP_STATUS.UNAUTHORIZED,
                    code: MESSAGE_CODES.EMAIL_TOKEN_EXPIRED
                  })
                }

                // Trường hợp sai chữ ký / token rác
                throw new ErrorWithStatus({
                  message: "Invalid token",
                  status: HTTP_STATUS.UNAUTHORIZED,
                  code: MESSAGE_CODES.INVALID_TOKEN
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

export const forgotPasswordRequestValidation = validate(
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
            const account = await databaseService.accounts.findOne({ email: value })
            if (!account) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.EMAIL_NOT_FOUND,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            req.account = account
            return true
          }
        }
      }
    },
    ["body"]
  )
)

export const forgotPasswordTokenValidation = validate(
  checkSchema(
    {
      forgot_password_token: {
        notEmpty: {
          errorMessage: new ErrorWithStatus({
            message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.BAD_REQUEST
          })
        },
        custom: {
          options: async (value, { req }) => {
            // verifyToken
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.PRIVATE_KEY_SIGN_FORGOT_PASSWORD_TOKEN as string
              })
              const { user_id } = decoded_forgot_password_token
              const account = await databaseService.accounts.findOne({
                _id: new ObjectId(user_id)
              })
              if (!account) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
              if (account.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.FORFOT_PASSWORD_TOKEN_INVALID, // "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
                  status: HTTP_STATUS.UNAUTHORIZED // 401
                })
              }
              req.decoded_forgot_password_token = decoded_forgot_password_token
            } catch (error) {
              // Lỗi do verify

              if (error instanceof JsonWebTokenError) {
                if (error.name === "TokenExpiredError") {
                  throw new ErrorWithStatus({
                    message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_EXPIRED,
                    status: HTTP_STATUS.UNAUTHORIZED,
                    code: MESSAGE_CODES.FORGOT_PASSWORD_TOKEN_EXPIRED
                  })
                }
                throw new ErrorWithStatus({
                  message: _.capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED,
                  code: MESSAGE_CODES.FORGOT_PASSWORD_TOKEN_INVALID
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

export const resetPasswordValidation = validate(
  checkSchema(
    {
      password: passwordValidation,
      confirm_password: confirmPasswordValidation
    },
    ["body"]
  )
)

export const verifiedUserValidation = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_access_token as TokenPayload
  // Nếu chưa được verify
  if (verify === AccountVerifyStatus.UNVERIFIED) {
    return next(
      new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_VERIFY,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  }
  next()
}

export const updateMeValidation = validate(
  checkSchema(
    {
      name: {
        optional: true,
        ...nameValidation,
        notEmpty: false
      },
      date_of_birth: {
        optional: true,
        ...dateOfBirthValidation,
        notEmpty: false
      },
      phone: {
        optional: true,
        ...phoneValidation,
        notEmpty: false
      }
    },
    ["body"]
  )
)

export const changePasswordValidation = validate(
  checkSchema(
    {
      old_password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING
        }
      },
      password: {
        ...passwordValidation,
        custom: {
          options: (value, { req }) => {
            if (value === req.body.old_password) {
              throw new Error(USER_MESSAGES.NEW_PASSWORD_CANNOT_BE_THE_SAME_AS_OLD_PASSWORD)
            }
            return true
          }
        }
      },
      confirm_password: confirmPasswordValidation
    },
    ["body"]
  )
)

export const updateAccountValidation = validate(
  checkSchema({
    id: {
      in: ["params"],
      custom: {
        options: (value) => ObjectId.isValid(value),
        errorMessage: USER_MESSAGES.ACCOUNT_ID_IS_INVALID
      }
    },
    status: {
      in: ["body"],
      optional: true,
      isIn: {
        options: [Object.values(AccountStatus)],
        errorMessage: `${USER_MESSAGES.STATUS_IS_INVALID}. Giá trị cho phép: ${Object.values(AccountStatus).join(", ")}`
      }
    },
    role_id: {
      in: ["body"],
      optional: true,
      custom: {
        options: async (value) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              message: USER_MESSAGES.ROLE_ID_IS_INVALID,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }
          // Tùy chọn: Kiểm tra xem Role ID này có tồn tại trong DB không
          const role = await databaseService.roles.findOne({ _id: new ObjectId(String(value)) })
          if (!role)
            throw new ErrorWithStatus({
              message: USER_MESSAGES.ROLE_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          return true
        }
      }
    }
  })
)
