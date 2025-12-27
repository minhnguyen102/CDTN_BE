import axios from "axios"
import { config } from "dotenv"
config()

const SPEEDSMS_API_URL = "https://api.speedsms.vn/index.php/sms/send"

class SmsService {
  // Chuyển đổi đầu số từ 03 -> 843
  private formatPhoneNumber(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, "") // Xóa ký tự không phải số
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "84" + cleanPhone.substring(1)
    }
    return cleanPhone
  }

  // Gửi tin nhắn SMS qua SpeedSMS
  async sendSMS({ phone, content }: { phone: string; content: string }) {
    const accessToken = process.env.SPEEDSMS_ACCESS_TOKEN

    if (!accessToken) {
      console.warn("⚠️ Chưa cấu hình SPEEDSMS_ACCESS_TOKEN trong .env")
      return
    }

    const formattedPhone = this.formatPhoneNumber(phone)

    try {
      // Gọi API SpeedSMS
      const response = await axios.post(
        SPEEDSMS_API_URL,
        {
          to: [formattedPhone],
          content: content,
          sms_type: 3,
          sender: "SPEEDSMS"
        },
        {
          auth: {
            username: accessToken,
            password: "x"
          }
        }
      )
      console.log("👉 SpeedSMS Response:", response.data)

      // Kiểm tra kết quả trả về từ SpeedSMS
      const { status, code, message } = response.data

      if (status === "success" || code === "00") {
        console.log(`✅ SMS sent to ${formattedPhone}: Success`)
        // TODO: Lưu log vào DB tại đây nếu cần (sms_logs)
      } else {
        console.warn(`⚠️ SMS API Warning: ${message} (Tài khoản chưa có Brandname, bỏ qua để test tiếp)`)
        console.log(`[MOCK SMS FALLBACK] 📨 Bạn vừa gửi tin đến: ${formattedPhone}`)
        console.log(`➤ Nội dung: ${content}`)
      }
    } catch (error: any) {
      console.error("❌ Lỗi gọi API SpeedSMS:", error.message)
    }
  }
}

export default new SmsService()
