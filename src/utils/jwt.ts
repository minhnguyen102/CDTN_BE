import { config } from "dotenv"
import jwt, { SignOptions } from "jsonwebtoken"
import { TokenPayload } from "~/models/requests/Account.request"
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

export const verifyToken = ({
  token,
  secretOrPublicKey = process.env.PRIVATE_KEY_SIGN_TOKEN as string
}: {
  token: string
  secretOrPublicKey?: string
}) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) {
        return reject(error)
      }
      resolve(decoded as TokenPayload)
    })
  })
}
