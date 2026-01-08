import { RegisterReqBody, updateAccountReqBody, updateMeReqBody } from "../models/requests/Account.request"
import databaseService from "./database.servies"
import Account from "../models/schema/Account.schema"
import { generatePassword, hashPassword } from "../utils/crypto"
import { signToken } from "../utils/jwt"
import { AccountStatus, AccountVerifyStatus, RoleStatus, TokenType } from "../constants/enums"
import { config } from "dotenv"
config()
import ms from "ms"
import RefreshToken from "../models/schema/RefreshToken.schema"
import { ObjectId } from "mongodb"
import USER_MESSAGES from "../constants/message"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { sendVerificationEmail } from "../utils/mailer"
import { deleteImage } from "../utils/cloudinary"
import { removeAccents } from "../utils/helpers"

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

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: AccountVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.REFRESH_TOKEN,
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
        // Tìm role_id
        {
          $match: {
            _id: role_id,
            isDeleted: false, // (Đảm bảo role không bị xóa
            status: RoleStatus.ACTIVE // và đang active)
          }
        },
        // Lookup sang collection 'permissions'
        {
          $lookup: {
            from: "permissions",
            localField: "permissionIds",
            foreignField: "_id",
            as: "permissions"
          }
        },
        // Chỉ lấy ra trường name và mảng tên permission
        {
          $project: {
            _id: 0,
            role_name: "$name",
            permissions: "$permissions.name" // Chỉ lấy mảng TÊN
          }
        }
      ])
      .toArray()

    if (roleData.length === 0) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ROLE_NOT_FOUND_OR_INACTIVE,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

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

  async register({ payload }: { payload: RegisterReqBody }) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: AccountVerifyStatus.UNVERIFIED
    })
    const verificationLink = `${process.env.BASE_URL_ADMIN}/verify-email?token=${email_verify_token}`
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Xin chào!</h2>
        <p>Cảm ơn bạn đã đăng ký. Vui lòng click vào nút bên dưới để xác thực:</p>
        <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Xác thực ngay
        </a>
      </div>
    `
    await sendVerificationEmail({ toEmail: payload.email, subject: "Xác thực tài khoản", html })
    const { role_id, ...restPayload } = payload
    const role_id_object = new ObjectId(role_id)
    const key_search = removeAccents(payload.name + " " + payload.email)
    await databaseService.accounts.insertOne(
      new Account({
        _id: user_id,
        ...restPayload,
        role_id: role_id_object,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        key_search
      })
    )
    return true
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

  async verifyEmail({ user_id, email }: { user_id: string; email: string }) {
    const password = generatePassword()
    const html = `
    Email: ${email}
    Your password: ${password}`

    await Promise.all([
      databaseService.accounts.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: "",
            verify: AccountVerifyStatus.VERIFIED,
            status: AccountStatus.ACTIVE,
            password: hashPassword(password)
          },
          $currentDate: {
            updatedAt: true
          }
        }
      ),
      sendVerificationEmail({ toEmail: email, subject: "Gửi mật khẩu", html })
    ])
    return true
  }

  async resendEmailVerify({ user_id, verify, email }: { user_id: string; verify: AccountVerifyStatus; email: string }) {
    const new_email_verify_token = await this.signEmailVerifyToken({ user_id, verify })

    const verificationLink = `${process.env.BASE_URL}/resend-verify-email?token=${new_email_verify_token}`
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Xin chào!</h2>
        <p>Cảm ơn bạn đã đăng ký. Vui lòng click vào nút bên dưới để xác thực:</p>
        <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Xác thực ngay
        </a>
      </div>
    `
    await Promise.all([
      sendVerificationEmail({ toEmail: email, subject: "Xác thực tài khoản", html }),
      databaseService.accounts.updateOne(
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
    ])
  }

  async forgotPassword({ user_id, verify, email }: { user_id: string; verify: AccountVerifyStatus; email: string }) {
    // sign forgot_password_token và lưu vào db
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    const resetLink = `${process.env.BASE_URL_ADMIN}/forgot-password-token?token=${forgot_password_token}`
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #333;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu lấy lại mật khẩu cho tài khoản liên kết với email này.</p>
        <p>Nếu bạn thực hiện yêu cầu này, vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu mới:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Đặt lại mật khẩu
            </a>
        </div>

        <p style="color: #666; font-size: 14px;">
            <em>Lưu ý: Đường dẫn này chỉ có hiệu lực trong vòng 15 phút.</em><br>
            Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
        </p>
      </div>
    `
    await Promise.all([
      databaseService.accounts.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            forgot_password_token
          },
          $currentDate: {
            updatedAt: true
          }
        }
      ),
      // Send email cho user để thực hiện điều hướng sang trang đổi mật khẩu
      sendVerificationEmail({ toEmail: email, subject: "Hỗ trợ lấy lại mật khẩu", html })
    ])
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
          $unwind: {
            path: "$role",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            role_name: "$role.name"
          }
        },
        {
          $project: {
            email_verify_token: 0,
            forgot_password_token: 0,
            password: 0,
            verify: 0,
            role_id: 0,
            createdAt: 0,
            updatedAt: 0,
            role: 0,
            key_search: 0
          }
        }
      ])
      .toArray()

    return account[0]
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: updateMeReqBody & { key_search?: string } }) {
    const _account = await databaseService.accounts.findOne({
      _id: new ObjectId(user_id)
    })
    const { email } = _account as Account

    // Xử lí date_of_birth
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload

    // Xử lí khi thay đổi name => phải thay đổi key_search
    const { name } = payload
    if (name) {
      _payload.key_search = removeAccents(name + " " + email)
    }
    const account = await databaseService.accounts.findOneAndUpdate(
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
          date_of_birth: 1,
          name: 1,
          phone: 1
        },
        returnDocument: "after"
      }
    )

    return account
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

  async getList({
    page,
    limit,
    search,
    roleId,
    status
  }: {
    page: number
    limit: number
    search?: string
    roleId?: string
    status?: string
  }) {
    // Cho phép hiển thị cả những tài khoản đang inactive
    const objectFind: any = {}
    if (roleId) {
      objectFind.role_id = new ObjectId(roleId)
    }

    //Filter theo Search (Tìm theo Tên, Email)
    if (search) {
      // objectFind.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
      objectFind.key_search = { $regex: removeAccents(search), $options: "i" }
    }

    if (status) {
      objectFind.status = status
    }

    const pipeline: any[] = [
      { $match: objectFind },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },

      //Join với bảng Roles để lấy tên vai trò
      {
        $lookup: {
          from: "roles",
          localField: "role_id",
          foreignField: "_id",
          as: "roleDetails"
        }
      },

      //Unwind mảng roleDetails (vì lookup trả về mảng)
      {
        $unwind: {
          path: "$roleDetails",
          preserveNullAndEmptyArrays: true // Giữ lại User ngay cả khi không tìm thấy Role (để không bị mất dữ liệu)
        }
      },
      {
        $addFields: {
          role_name: "$roleDetails.name"
        }
      },

      //Project - Chọn trường hiển thị và ẨN MẬT KHẨU
      {
        $project: {
          password: 0,
          forgotPasswordToken: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          role_id: 0,
          createdAt: 0,
          updatedAt: 0,
          roleDetails: 0,
          key_search: 0
        }
      }
    ]

    const [accounts, totalFilteredDocuments] = await Promise.all([
      databaseService.accounts.aggregate(pipeline).toArray(),
      databaseService.accounts.countDocuments(objectFind)
    ])
    const totalPages = Math.ceil(totalFilteredDocuments / limit)
    return {
      accounts,
      pagination: {
        currentPage: page,
        limit: limit,
        total: totalFilteredDocuments,
        totalPages: totalPages
      }
    }
  }

  async updateAvatar({ user_id, file }: { user_id: string; file: Express.Multer.File }) {
    try {
      const user = await databaseService.accounts.findOne({ _id: new ObjectId(user_id) })

      if (user?.avatar_id) {
        await deleteImage(user.avatar_id)
      }

      const updatedUser = await databaseService.accounts.findOneAndUpdate(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            avatar: file.path, // Lưu link ảnh
            avatar_id: file.filename, // Lưu ID ảnh để sau này xóa
            updatedAt: new Date()
          }
        },
        {
          returnDocument: "after", // Trả về user mới sau khi update
          projection: {
            avatar: 1,
            _id: 0
          }
        }
      )

      return updatedUser
    } catch (error) {
      // Nếu lỗi DB, có thể cân nhắc xóa ảnh vừa upload lên Cloudinary để tránh rác
      if (file.filename) await deleteImage(file.filename)
      throw error
    }
  }

  async updateAccount({ accountId, payload }: { accountId: string; payload: updateAccountReqBody }) {
    const _payload: any = { ...payload }
    if (payload.role_id) {
      _payload.role_id = new ObjectId(payload.role_id)
    }

    const result = await databaseService.accounts.updateOne(
      { _id: new ObjectId(accountId) },
      {
        $set: {
          ..._payload
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )

    if (!result.modifiedCount) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return true
  }
}

const accountsServices = new AccountsServices()
export default accountsServices
