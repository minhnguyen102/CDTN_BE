import { JwtPayload } from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { AccountVerifyStatus, RoleAccount, TableStatus, TokenType } from "../../constants/enums"

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: Date
  role: RoleAccount
  ownerId: ObjectId
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
  role: RoleAccount
}

export interface resetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}
export interface updateMeReqBody {
  name?: string
  date_of_birth?: string
  avatar?: string
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
