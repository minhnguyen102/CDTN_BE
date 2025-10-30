import { RegisterReqBody } from "~/models/requests/Account.request"
import databaseService from "./database.servies"
import Account from "~/models/schema/Account.schema"
import { hashPassword } from "~/utils/crypto"
import { signToken } from "~/utils/jwt"
import { AccountVerifyStatus, TokenType } from "~/constants/enums"
import { config } from "dotenv"
config()
import ms from "ms"
import RefreshToken from "~/models/schema/RefreshToken.schema"
import { ObjectId } from "mongodb"
import USER_MESSAGES from "~/constants/message"

class AccountsServices {
  private signAccessToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_ACCESS_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_ACCESS_TOKEN as ms.StringValue
      }
    })
  }

  private signRefreshToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_REFRESH_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_REFRESH_TOKEN as ms.StringValue
      }
    })
  }

  private signEmailVerifyToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        TokenType: TokenType.EmailVerifyToken
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_EMAIL_VERIFY_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_EMAIL_VERIFY_TOKEN as ms.StringValue
      }
    })
  }

  private signForgotPasswordToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        TokenType: TokenType.ForgotPasswordToken
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_FORGOT_PASSWORD_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_FORGOT_PASSWORD_TOKEN as ms.StringValue
      }
    })
  }

  private signAccessAndRefreshToken({ user_id }: { user_id: string }) {
    return Promise.all([this.signAccessToken({ user_id }), this.signRefreshToken({ user_id })])
  }

  async login({ user_id }: { user_id: string }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id })
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
    const email_verify_token = await this.signEmailVerifyToken({ user_id: user_id.toString() })
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
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id: user_id.toString() })
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async refreshToken({ refresh_token, user_id }: { refresh_token: string; user_id: string }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id }),
      this.signRefreshToken({ user_id }),
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

  async verifyEmail({ user_id }: { user_id: string }) {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({ user_id }),
      this.signRefreshToken({ user_id }),
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

  async resendEmailVerify({ user_id }: { user_id: string }) {
    const new_email_verify_token = await this.signEmailVerifyToken({ user_id })
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

  async forgotPassword({ user_id }: { user_id: string }) {
    // sign forgot_password_token và lưu vào db
    const forgot_password_token = await this.signForgotPasswordToken({ user_id })
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
}

const accountsServices = new AccountsServices()
export default accountsServices
