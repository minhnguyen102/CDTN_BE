import { RegisterReqBody } from "~/models/requests/Account.request"
import databaseService from "./database.servies"
import Account from "~/models/schema/Account.schema"
import { hashPassword } from "~/utils/crypto"

class AccountsServices {
  async login(payload: { email: string; password: string }) {
    const { email, password } = payload
    const result = await databaseService.accounts.findOne({ email, password })
    return result
  }

  async register(payload: RegisterReqBody) {
    const result = await databaseService.accounts.insertOne(
      new Account({
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    return result
  }
}

const accountsServices = new AccountsServices()
export default accountsServices
