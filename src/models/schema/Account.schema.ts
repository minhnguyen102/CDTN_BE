import { ObjectId } from "mongodb"
import { AccountVerifyStatus, RoleAccount } from "~/constants/enums"

interface AccountType {
  _id?: ObjectId
  name: string
  email: string // (Tạo unique index)
  password: string // (Lưu dạng hash)
  date_of_birth: Date
  role: RoleAccount // "Owner" hoặc "Employee"
  avatar?: string
  ownerId: ObjectId // (Ref: 'accounts') - Áp dụng Quy tắc 4
  createdAt?: Date
  updatedAt?: Date
  email_verify_token?: string // jwt hoặc '' nếu đã được xác thực email
  forgot_password_token?: string // jwt hoặc '' nếu đã được xác thực
  verify?: AccountVerifyStatus //
}

export default class Account {
  _id?: ObjectId
  name: string
  email: string // (Tạo unique index)
  password: string // (Lưu dạng hash)
  date_of_birth: Date
  role: RoleAccount // "Owner" hoặc "Employee"
  avatar: string // optional
  ownerId: ObjectId | string // (Ref: 'accounts') - Áp dụng Quy tắc 4
  createdAt: Date
  updatedAt: Date
  email_verify_token: string // jwt hoặc '' nếu đã được xác thực email
  forgot_password_token: string // jwt hoặc '' nếu đã được xác thực
  verify: AccountVerifyStatus

  constructor(account: AccountType) {
    const date = new Date()
    this._id = account._id
    this.name = account.name
    this.email = account.email
    this.password = account.password
    this.date_of_birth = account.date_of_birth
    this.role = account.role
    if (this.role === RoleAccount.Employee) {
      if (!account.ownerId) {
        throw new Error("Employee account must have an ownerId.")
      }
      this.ownerId = account.ownerId
    } else {
      this.ownerId = ""
    }
    this.avatar = account.avatar || ""
    this.createdAt = account.createdAt || date
    this.updatedAt = account.updatedAt || date
    this.email_verify_token = account.email_verify_token || ""
    this.forgot_password_token = account.forgot_password_token || ""
    this.verify = account.verify || AccountVerifyStatus.Unverified
  }
}
