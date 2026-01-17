import cron from "node-cron"
import orderServices from "../services/orders.services"
import aiService from "../services/legacyAI.services"
import { sendWeeklyReportToManager } from "./mailer"

const handleWeeklyReport = async ({ toEmail = "minhkhac1002@gmail.com" }: { toEmail?: string }) => {
  try {
    // Fetch Data (Gom số liệu từ MongoDB)
    const data = await orderServices.getWeeklyStatistics()
    // console.log("   -> Dữ liệu thu được:", JSON.stringify(data, null, 2))

    // Gửi cho AI phân tích
    console.log("   - Đang gửi dữ liệu cho AI phân tích...")
    const result = await aiService.generateWeeklyReport(data)
    // Gửi kết quả cho admin
    console.log("   - Đang gửi email cho Admin...")
    await sendWeeklyReportToManager({
      toEmail,
      subject: "Báo cáo doanh thu và đề xuất kinh doanh",
      html: result
    })
  } catch (error) {
    console.error("❌ [CRON] Lỗi khi chạy báo cáo tuần:", error)
  }
}

export const initScheduledJobs = () => {
  // Cấu hình thời gian gửi
  const scheduleExpression = "0 8 * * 1"
  // const scheduleExpression = "*/10 * * * * *" // test

  cron.schedule(
    scheduleExpression,
    () => {
      handleWeeklyReport({})
    },
    {
      timezone: "Asia/Ho_Chi_Minh" // Cấu hình chuẩn múi giờ VN
    }
  )
}
