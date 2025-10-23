import databaseService from "./database.servies"

class AccountsServices {
  async login(payload: { email: string; password: string }) {
    const { email, password } = payload
    const result = await databaseService.accounts.findOne({ email, password })
    return result
  }
}

const accountsServices = new AccountsServices()
export default accountsServices
