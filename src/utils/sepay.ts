import { config } from "dotenv"
import queryString from "querystring"
config()

export const generatePaymentQR = ({ amount, des }: { amount: number; des: string }) => {
  const bank_account_no = process.env.BANK_ACCOUNT_NO || "0327593620"
  const bank_name = process.env.BANK_NAME || "MB"
  const bank_template = process.env.BANK_TEMPLATE || "compact"

  const baseUrl = "https://qr.sepay.vn/img"

  const query = queryString.stringify({
    acc: bank_account_no,
    bank: bank_name,
    amount: amount,
    des: des,
    template: bank_template
  })
  // console.log(`${baseUrl}?${query}`)
  return `${baseUrl}?${query}`
}
