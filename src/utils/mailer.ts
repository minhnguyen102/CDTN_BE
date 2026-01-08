import nodemailer from "nodemailer"
import dotenv from "dotenv"
import { stubObject } from "lodash"

dotenv.config()

// Cấu hình Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // upgrade later with STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Hàm gửi email
export const sendVerificationEmail = async ({
  toEmail,
  subject,
  html
}: {
  toEmail: string
  subject: string
  html: string
}) => {
  const mailOptions = {
    from: "Snackio <contact@snackio.vn>",
    to: toEmail,
    subject,
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log("Email sent successfully to:", toEmail)
  } catch (error) {
    console.error("Error sending email:", error)
    throw error // Ném lỗi ra ngoài để Controller bắt
  }
}

// Gửi email cho chủ quản lí nhà hàng thứ 2 hàng tuần thông qua trợ lí AI
export const sendWeeklyReportToManager = async ({
  toEmail,
  subject,
  html
}: {
  toEmail: string
  subject: string
  html: string
}) => {
  const mailOptions = {
    to: toEmail,
    subject: subject,
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log("Email sent successfully to:", toEmail)
  } catch (error) {
    console.error("Error sending email:", error)
    throw error // Ném lỗi ra ngoài để Controller bắt
  }
}
