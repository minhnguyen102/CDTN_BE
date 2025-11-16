import { RegisterReqBody, updateMeReqBody } from "../models/requests/Account.request"
import databaseService from "./database.servies"
import Account from "../models/schema/Account.schema"
import { hashPassword } from "../utils/crypto"
import { signToken } from "../utils/jwt"
import { AccountVerifyStatus, RoleAccount, RoleStatus, TokenType } from "../constants/enums"
import { config } from "dotenv"
config()
import ms from "ms"
import RefreshToken from "../models/schema/RefreshToken.schema"
import { ObjectId } from "mongodb"
import USER_MESSAGES from "../constants/message"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"

class AccountsServices {
  private signAccessToken({
    user_id,
    verify,
    role_name,
    permissions
  }: {
    user_id: string
    verify: AccountVerifyStatus
    role_name: string
    permissions: string[]
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ACCESS_TOKEN,
        verify,
        role_name,
        permissions
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_ACCESS_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_ACCESS_TOKEN as ms.StringValue
      }
    })
  }

  private signRefreshToken({
    user_id,
    verify
    // role
  }: {
    user_id: string
    verify: AccountVerifyStatus
    // role: RoleAccount
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.REFRESH_TOKEN,
        verify
        // role
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
        TokenType: TokenType.EMAIL_VERIFY_TOKEN,
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
        TokenType: TokenType.FORGOT_PASSWORD_TOKEN,
        verify
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_FORGOT_PASSWORD_TOKEN as string,
      optionals: {
        expiresIn: process.env.EXPIRES_IN_FORGOT_PASSWORD_TOKEN as ms.StringValue
      }
    })
  }

  private signAccessAndRefreshToken({
    user_id,
    verify,
    role_name,
    permissions
  }: {
    user_id: string
    verify: AccountVerifyStatus
    role_name: string
    permissions: string[]
  }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify, role_name, permissions }),
      this.signRefreshToken({ user_id, verify })
    ])
  }

  private async getRoleData({ role_id }: { role_id: ObjectId }) {
    // Dùng aggregate để lookup role và permissions
    const roleData = await databaseService.roles
      .aggregate([
        // 1. Tìm role_id
        {
          $match: {
            _id: role_id,
            isDeleted: false, // (Đảm bảo role không bị xóa
            status: RoleStatus.ACTIVE // và đang active)
          }
        },
        // 2. Lookup sang collection 'permissions'
        {
          $lookup: {
            from: "permissions",
            localField: "permissionIds",
            foreignField: "_id",
            as: "permissions"
          }
        },
        // 3. Chỉ lấy ra trường name và mảng tên permission
        {
          $project: {
            _id: 0,
            role_name: "$name",
            permissions: "$permissions.name" // Chỉ lấy mảng TÊN
          }
        }
      ])
      .toArray()

    // console.log("roleData: ", roleData)

    if (roleData.length === 0) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ROLE_NOT_FOUND_OR_INACTIVE,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Trả về { role_name: "Employee", permissions: ["view_tables", ...] }
    return roleData[0]
  }

  async login({ account }: { account: Account }) {
    const { _id, verify, role_id } = account
    const user_id = (_id as ObjectId).toString()
    const { role_name, permissions } = await this.getRoleData({ role_id })
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify,
      role_name,
      permissions
    })
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
      verify: AccountVerifyStatus.UNVERIFIED
    })
    console.log("Giả lập gửi email_verify_token cho account: ", email_verify_token)
    const { role_id, ...restPayload } = payload
    const role_id_object = new ObjectId(role_id)
    await databaseService.accounts.insertOne(
      new Account({
        _id: user_id,
        ...restPayload,
        role_id: role_id_object,
        email_verify_token,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    const { role_name, permissions } = await this.getRoleData({ role_id: role_id_object })
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: AccountVerifyStatus.UNVERIFIED,
      role_name,
      permissions
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
    const account = await databaseService.accounts.findOne({ _id: new ObjectId(user_id) })
    if (!account) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const { role_name, permissions } = await this.getRoleData({ role_id: account.role_id })
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify, role_name, permissions }),
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
    const account = await databaseService.accounts.findOne({ _id: new ObjectId(user_id) })
    const { role_id } = account as Account
    const { role_name, permissions } = await this.getRoleData({ role_id })
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify, role_name, permissions }),
      this.signRefreshToken({ user_id, verify }),
      databaseService.accounts.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: "",
            verify: AccountVerifyStatus.VERIFIED
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
    const account = await databaseService.accounts
      .aggregate([
        {
          $match: { _id: new ObjectId(user_id) }
        },
        {
          $lookup: {
            from: "roles",
            localField: "role_id",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          // $unwind để biến mảng "role" (chỉ có 1 phần tử) thành object
          $unwind: {
            path: "$role",
            preserveNullAndEmptyArrays: true // Giữ lại account nếu role không tìm thấy
          }
        },
        {
          $project: {
            email_verify_token: 0,
            forgot_password_token: 0,
            password: 0,
            verify: 0,
            role_id: 0, // Ẩn role_id (vì đã có object 'role'),
            createdAt: 0,
            updatedAt: 0,
            "role.permissionIds": 0, // Ẩn mảng ID quyền
            "role.isDeleted": 0,
            "role.deletedAt": 0,
            "role.createdAt": 0,
            "role.updatedAt": 0
          }
        }
      ])
      .toArray()

    return account[0]
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
