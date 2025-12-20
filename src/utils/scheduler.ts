import cron from "node-cron"

const handleWeeklyReport = async () => {
  console.log("[CRON] Bắt đầu tác vụ: Gửi báo cáo doanh thu tuần...")

  try {
    // 1. Fetch Data (Gom số liệu từ MongoDB)
    console.log("   - Đang tổng hợp dữ liệu đơn hàng...")

    // 2. Call AI (Gửi cho Gemini phân tích)
    console.log("   - Đang gửi dữ liệu cho AI phân tích...")

    // 3. Send Email (Gửi kết quả cho Admin)
    console.log("   - Đang gửi email cho Admin...")

    console.log("✅ [CRON] Tác vụ hoàn tất thành công!")
  } catch (error) {
    console.error("❌ [CRON] Lỗi khi chạy báo cáo tuần:", error)
  }
}

// Hàm khởi tạo các Cron Job
export const initScheduledJobs = () => {
  // Cấu hình thời gian gửi
  // const scheduleExpression = "0 8 * * 1"
  const scheduleExpression = "*/10 * * * * *" // test

  // const scheduleExpression = "* * * * *" // nếu muốn test là gửi ngay lập tưc

  cron.schedule(
    scheduleExpression,
    () => {
      handleWeeklyReport()
    },
    {
      timezone: "Asia/Ho_Chi_Minh" // Cấu hình chuẩn múi giờ VN
    }
  )

  console.log("🕒 Hệ thống Scheduler đã được kích hoạt")
}
