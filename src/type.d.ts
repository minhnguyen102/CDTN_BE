import { Request } from "express"
import Account from "./models/schema/Account.schema"
import { JwtPayload } from "jsonwebtoken"

declare module "express" {
  interface Request {
    account?: Account
    decoded_access_token?: JwtPayload
    decoded_refresh_token?: JwtPayload
    decoded_email_verify_token?: JwtPayload
  }
}
