import { config } from "dotenv"
import jwt, { SignOptions } from "jsonwebtoken"
config()

export const signToken = ({
  payload,
  privateKey = process.env.PRIVATE_KEY_SIGN_TOKEN as string,
  optionals = {}
}: {
  payload: any
  privateKey?: string
  optionals?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    const finalOptionals: SignOptions = {
      algorithm: "HS256",
      ...optionals
    }
    jwt.sign(payload, privateKey, finalOptionals, function (error, token) {
      if (error) {
        throw reject(error)
      }
      resolve(token as string)
    })
  })
}
