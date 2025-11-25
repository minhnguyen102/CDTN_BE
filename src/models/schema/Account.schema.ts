import { ObjectId } from "mongodb"
import { AccountStatus, AccountVerifyStatus } from "../../constants/enums"

interface AccountType {
  _id?: ObjectId
  name: string
  email: string // (Tạo unique index)
  password?: string // (Lưu dạng hash)
  phone: string
  status?: AccountStatus
  date_of_birth: Date
  role_id: ObjectId
  key_search: string // search theo name and mail
  avatar?: string
  avatar_id?: string
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
  phone: string
  status: AccountStatus
  date_of_birth: Date
  role_id: ObjectId
  key_search: string // search theo name and mail
  avatar: string // optional
  avatar_id: string
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
    this.password = account.password || ""
    this.phone = account.phone
    this.status = account.status || AccountStatus.INACTIVE
    this.date_of_birth = account.date_of_birth
    this.role_id = account.role_id
    this.key_search = account.key_search
    this.avatar = account.avatar || ""
    this.avatar_id = account.avatar_id || ""
    this.createdAt = account.createdAt || date
    this.updatedAt = account.updatedAt || date
    this.email_verify_token = account.email_verify_token || ""
    this.forgot_password_token = account.forgot_password_token || ""
    this.verify = account.verify || AccountVerifyStatus.UNVERIFIED
  }
}
