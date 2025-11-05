import { createHash, randomBytes } from "crypto"
import { config } from "dotenv"
config()
function sha256(content: string) {
  return createHash("sha256").update(content).digest("hex")
}

export function hashPassword(password: string) {
  return sha256(password + process.env.HASH_PASSWORD_SECRET)
}

export function randomQrToken(tokenLength: number = 20) {
  return randomBytes(tokenLength).toString("hex")
}
