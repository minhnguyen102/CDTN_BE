import nodemailer from "nodemailer"
import dotenv from "dotenv"

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
    from: '"Nhà hàng QR" <no-reply@restaurant.com>',
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
