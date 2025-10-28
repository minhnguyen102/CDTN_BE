import { Request } from "express"
import Account from "./models/schema/Account.schema"

declare module "express" {
  interface Request {
    account?: Account
  }
}
