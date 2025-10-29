import { JwtPayload } from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { RoleAccount, TokenType } from "~/constants/enums"

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

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}
