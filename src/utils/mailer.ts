import nodemailer from "nodemailer"
import dotenv from "dotenv"

// Load biến môi trường (nếu chưa load ở file entry point như app.js)
dotenv.config()

// 1. Cấu hình Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // upgrade later with STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// 2. Hàm gửi email (dùng export const để xuất khẩu hàm)
export const sendVerificationEmail = async ({
  toEmail,
  subject,
  html
}: {
  toEmail: string
  subject: string
  html: string
}) => {
  // Giả sử frontend chạy port 3000
  // const verificationLink = `${process.env.BASE_URL}/verify-email?token=${email_verify_token}`

  const mailOptions = {
    from: '"Nhà hàng QR" <no-reply@restaurant.com>',
    to: process.env.SMTP_USER,
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
