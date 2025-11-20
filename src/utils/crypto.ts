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

export const generatePassword = (length: number = 12): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const symbols = "!@#$&"
  const numbers = "0123456789"

  let password = ""
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]

  const allChars = lowercase + uppercase + symbols + numbers

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")

  return password
}
