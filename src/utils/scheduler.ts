import cron from "node-cron"
import orderServices from "../services/orders.services"
import aiService from "../services/ai.services"
import { sendWeeklyReportToManager } from "./mailer"
import databaseService from "../services/database.servies"
import { BookingStatus } from "../constants/enums"
import { ObjectId } from "mongodb"
import { getIO } from "./socket"

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

export const initScheduledJobsBooking = () => {
  // Cấu hình: Thời gian ân hạn (30 phút)
  const GRACE_PERIOD_MINUTES = 30
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date()
      const confirmedBookings = await databaseService.bookings
        .find({
          status: BookingStatus.CONFIRMED,
          bookingDate: { $lte: now }
        })
        .toArray()

      if (confirmedBookings.length === 0) {
        console.log("✅ [CRON] Không có đơn nào cần xử lý.")
        return
      }

      const overdueBookingIds: ObjectId[] = []
      for (const booking of confirmedBookings) {
        const bookingDateTime = new Date(booking.bookingDate)
        const [hours, minutes] = booking.bookingTime.split(":").map(Number)
        bookingDateTime.setHours(hours, minutes, 0, 0) // cho ra đúng ngày giờ đặt thay vì chỉ có ngày và giờ là 00

        const expirationTime = new Date(bookingDateTime.getTime() + GRACE_PERIOD_MINUTES * 60000)
        if (now > expirationTime) {
          overdueBookingIds.push(booking._id)
          console.log(
            `❌ Phát hiện đơn quá hạn: ID ${booking._id} (Đặt lúc: ${booking.bookingTime}, Hết hạn: ${expirationTime.toLocaleTimeString()})`
          )
        }
        if (overdueBookingIds.length > 0) {
          await databaseService.bookings.updateMany(
            { _id: { $in: overdueBookingIds } },
            {
              $set: {
                status: BookingStatus.NO_SHOW, // Đổi trạng thái
                updatedAt: new Date(),
                cancelReason: "Hệ thống tự động hủy do quá giờ nhận bàn (Auto-Cancel)"
              }
            }
          )
          const io = getIO()
          io.to("admin_room").emit("bookings_auto_cancelled", {
            ids: overdueBookingIds,
            message: `Hệ thống đã tự động hủy ${overdueBookingIds.length} đơn quá hạn.` // Cần xử lí gửi về chi tiết hơn
          })

          console.log(`🗑️ [CRON] Đã hủy thành công ${overdueBookingIds.length} đơn quá hạn.`)
        } else {
          console.log("✅ [CRON] Tất cả các đơn CONFIRMED đều chưa quá giờ.")
        }
      }
    } catch (error) {
      console.error("⚠️ [CRON] Lỗi khi chạy job quét đơn:", error)
    }
  })
}
