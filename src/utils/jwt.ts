import { config } from "dotenv"
import jwt, { SignOptions } from "jsonwebtoken"
config()

export const signToken = ({
  payload,
  privateKey = process.env.PRIVATE_KEY_SIGN_TOKEN as string,
  optionals = {
    algorithm: "HS256"
  }
}: {
  payload: any
  privateKey?: string
  optionals?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, optionals, function (error, token) {
      if (error) {
        throw reject(error)
      }
      resolve(token as string)
    })
  })
}
