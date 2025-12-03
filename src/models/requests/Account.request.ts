import { JwtPayload } from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { AccountStatus, AccountVerifyStatus, RoleAccount, TableStatus, TokenType } from "../../constants/enums"

export interface RegisterReqBody {
  name: string
  email: string
  // password: string
  phone: string
  confirm_password: string
  date_of_birth: Date
  role_id: string
}
export interface LogoutReqBody {
  refresh_token: string
}
export interface RefreshTokenReqBody {
  refresh_token: string
}

export interface EmailVerifyTokenReqBody {
  email_verify_token: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: AccountVerifyStatus
  // role: RoleAccount
}

export interface resetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}
export interface updateMeReqBody {
  name?: string
  date_of_birth?: string
  phone?: string
}

export interface changePasswordReqBody {
  old_password: string
  password: string
  confirm_password: string
}
export interface createTableReqBody {
  capacity: number
}
export interface updateTableReqBody {
  capacity?: number
  status?: TableStatus
}

export interface updateAccountReqBody {
  status?: AccountStatus
  role_id?: string
}
