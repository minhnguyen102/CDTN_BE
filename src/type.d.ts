import { Request } from "express"
import Account from "./models/schema/Account.schema"
import { JwtPayload } from "jsonwebtoken"

declare module "express" {
  interface Request {
    account?: Account
    decode_access_token?: JwtPayload
  }
}
