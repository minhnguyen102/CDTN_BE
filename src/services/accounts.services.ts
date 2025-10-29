import { RegisterReqBody } from "~/models/requests/Account.request"
import databaseService from "./database.servies"
import Account from "~/models/schema/Account.schema"
import { hashPassword } from "~/utils/crypto"
import { signToken } from "~/utils/jwt"
import { TokenType } from "~/constants/enums"
import { config } from "dotenv"
config()
import ms from "ms"
import RefreshToken from "~/models/schema/RefreshToken.schema"
import { ObjectId } from "mongodb"

class AccountsServices {
  private signAccessToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      optionals: {
        expiresIn: process.env.EXPIRES_IN_ACCESS_TOKEN as ms.StringValue
      }
    })
  }

  private signRefreshToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      optionals: {
        expiresIn: process.env.EXPIRES_IN_REFRESH_TOKEN as ms.StringValue
      }
    })
  }

  private signAccessAndRefreshToken({ user_id }: { user_id: string }) {
    return Promise.all([this.signAccessToken({ user_id }), this.signRefreshToken({ user_id })])
  }

  async login({ user_id }: { user_id: string }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id })
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout({ refresh_token }: { refresh_token: string }) {
    await databaseService.refresh_tokens.deleteOne({ token: refresh_token })
    return true
  }

  async register(payload: RegisterReqBody) {
    const result = await databaseService.accounts.insertOne(
      new Account({
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id })
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async refreshToken({ refresh_token, user_id }: { refresh_token: string; user_id: string }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id }),
      this.signRefreshToken({ user_id }),
      databaseService.refresh_tokens.deleteOne({ token: refresh_token })
    ])
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
}

const accountsServices = new AccountsServices()
export default accountsServices
