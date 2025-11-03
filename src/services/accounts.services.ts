import { RegisterReqBody, updateMeReqBody } from "../models/requests/Account.request"
import databaseService from "./database.servies"
import Account from "../models/schema/Account.schema"
import { hashPassword } from "../utils/crypto"
import { signToken } from "../utils/jwt"
import { AccountVerifyStatus, TokenType } from "../constants/enums"
import { config } from "dotenv"
config()
import ms from "ms"
import RefreshToken from "../models/schema/RefreshToken.schema"
import { ObjectId } from "mongodb"
import USER_MESSAGES from "../constants/message"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"

class AccountsServices {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_ACCESS_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_ACCESS_TOKEN as ms.StringValue
      }
    })
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_REFRESH_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_REFRESH_TOKEN as ms.StringValue
      }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        TokenType: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_EMAIL_VERIFY_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_EMAIL_VERIFY_TOKEN as ms.StringValue
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        TokenType: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_FORGOT_PASSWORD_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_FORGOT_PASSWORD_TOKEN as ms.StringValue
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async login({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout({ refresh_token }: { refresh_token: string }) {
    await databaseService.refresh_tokens.deleteOne({ token: refresh_token })
    return true
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: AccountVerifyStatus.Unverified
    })
    console.log("Giả lập gửi email_verify_token cho account: ", email_verify_token)
    await databaseService.accounts.insertOne(
      new Account({
        _id: user_id,
        ...payload,
        email_verify_token,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    // const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: AccountVerifyStatus.Unverified
    })
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async refreshToken({
    refresh_token,
    user_id,
    verify
  }: {
    refresh_token: string
    user_id: string
    verify: AccountVerifyStatus
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify }),
      databaseService.refresh_tokens.deleteOne({ token: refresh_token })
    ])
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }

  async verifyEmail({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify }),
      databaseService.accounts.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: "",
            verify: AccountVerifyStatus.Verified
            // updatedAt: new Date() // Khởi tạo thời gian khi code chạy (thời điểm trước)
          },
          $currentDate: {
            updatedAt: true // Cập nhật thời gian khi lưu vào bản ghi (thời điểm sau)
          }
        }
      )
    ])
    return {
      access_token,
      refresh_token
    }
  }

  async resendEmailVerify({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    const new_email_verify_token = await this.signEmailVerifyToken({ user_id, verify })
    console.log("Giả lập gửi new_email_verify_token cho account: ", new_email_verify_token)
    await databaseService.accounts.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token: new_email_verify_token
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    // sign forgot_password_token và lưu vào db
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.accounts.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )
    // Send email cho user để thực hiện điều hướng sang trang đổi mật khẩu
    console.log("Giả định gửi link forgor_password_token cho người dùng: ", forgot_password_token)
    return true
  }

  async resetPassword({ user_id, new_password }: { user_id: string; new_password: string }) {
    await databaseService.accounts.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: "",
          password: hashPassword(new_password)
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )
    return true
  }

  async getMe({ user_id }: { user_id: string }) {
    const account = await databaseService.accounts.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          email_verify_token: 0,
          forgot_password_token: 0,
          password: 0,
          verify: 0
        }
      }
    )
    return account
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: updateMeReqBody }) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const result = await databaseService.accounts.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as updateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updatedAt: true
        }
      },
      {
        projection: {
          email_verify_token: 0,
          forgot_password_token: 0,
          password: 0,
          verify: 0
        },
        returnDocument: "after"
      }
    )
    return result
  }

  async changePassword({
    user_id,
    old_password,
    new_password
  }: {
    user_id: string
    old_password: string
    new_password: string
  }) {
    const account = await databaseService.accounts.findOne({ _id: new ObjectId(user_id) })
    if (!account) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    // Kiểm tra mật khẩu cũ
    if (account.password !== hashPassword(old_password)) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.OLD_PASSWORD_IS_INCORRECT,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    await databaseService.accounts.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )
    return true
  }
}

const accountsServices = new AccountsServices()
export default accountsServices
