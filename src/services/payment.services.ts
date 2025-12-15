import { ObjectId } from "mongodb"
import databaseService from "./database.servies" // Chú ý đường dẫn import database của bạn
import { PaymentMethod, PaymentStatus, TableStatus } from "../constants/enums"
import { getIO } from "../utils/socket"

class PaymentService {
  async handleSePayWebhook(data: any) {
    // Data SePay gửi về: { gateway, transactionDate, content, transferAmount, ... }
    const { content, transferAmount } = data

    if (!content || !transferAmount) {
      return { success: false, message: "Missing content or amount" }
    }

    // Regex để lấy OrderID từ nội dung chuyển khoản
    // Cấu hình SePay của bạn là "DH", nên regex sẽ tìm chữ "DH" + khoảng trắng + chuỗi ký tự
    const regex = /DH\s*([a-zA-Z0-9]+)/i
    const match = content.match(regex)
    // console.log("Nội dung bóc tách: ", match)
    if (!match) {
      return { success: false, message: "Invalid content format (Order ID not found)" }
    }

    const orderIdRaw = match[1] // Lấy được chuỗi ID

    // Validate OrderID
    if (!ObjectId.isValid(orderIdRaw)) {
      return { success: false, message: "Invalid MongoDB Order ID" }
    }
    const orderId = new ObjectId(String(orderIdRaw))

    // Tìm đơn hàng trong DB
    const order = await databaseService.orders.findOne({ _id: orderId })
    if (!order) {
      return { success: false, message: "Order not found" }
    }

    // Kiểm tra số tiền (Tránh nạp thiếu)
    if (transferAmount < order.totalAmount) {
      return { success: false, message: "Transfer amount is less than order total" }
    }

    // Kiểm tra Idempotency (Tránh xử lý lại đơn đã thanh toán)
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { success: true, message: "Order already paid" }
    }

    // Update Database (Chuyển trạng thái thành PAID, chuyển trạng thái, currentOrderId của bàn)
    await Promise.all([
      await databaseService.orders.updateOne(
        { _id: orderId },
        {
          $set: {
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: PaymentMethod.BANK,
            updatedAt: new Date(),
            finishedAt: new Date()
          }
        }
      ),
      await databaseService.orders.updateOne(
        { _id: orderId },
        {
          $set: {
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: PaymentMethod.BANK,
            updatedAt: new Date(),
            finishedAt: new Date()
          }
        }
      )
    ])

    await databaseService.tables.updateOne(
      { _id: new ObjectId(order.tableId) },
      {
        $set: {
          currentOrderId: null,
          status: TableStatus.AVAILABLE
        }
      }
    )

    // 7. [REAL-TIME] Bắn Socket thông báo
    const io = getIO()

    // a. Báo cho khách (Tại bàn đó) -> Để màn hình QR chuyển sang "Thành công"
    io.to(`table_${order.tableId}`).emit("payment_success", {
      orderId: orderIdRaw,
      amount: transferAmount,
      message: "Thanh toán thành công!"
    })

    // b. Báo cho Admin/Bếp (Để biết đơn đã trả tiền)
    io.to("admin_room").emit("payment_received", {
      orderId: orderIdRaw,
      tableNumber: order.tableNumber,
      amount: transferAmount,
      message: `Bàn ${order.tableNumber} vừa thanh toán ${transferAmount.toLocaleString()}đ`
    })

    return { success: true, message: "Payment processed successfully" }
  }
}

const paymentService = new PaymentService()
export default paymentService
