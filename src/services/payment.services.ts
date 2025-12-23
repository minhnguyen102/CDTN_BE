import { ObjectId } from "mongodb"
import databaseService from "./database.servies" // Chú ý đường dẫn import database của bạn
import { PaymentMethod, PaymentStatus, TableStatus } from "../constants/enums"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import USER_MESSAGES from "../constants/message"
import { getIO } from "../utils/socket"
import { OrderItemStatus } from "../constants/enums"
import { generatePaymentQR } from "../utils/sepay"

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
      await databaseService.tables.updateOne(
        { _id: new ObjectId(order.tableId) },
        {
          $set: {
            currentOrderId: null,
            status: TableStatus.AVAILABLE
          }
        }
      )
    ])

    // lọc dữ liệu từ order

    const itemQuantityMap = new Map<string, number>()
    const uniqueDishIds: ObjectId[] = []

    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        if (item.status !== OrderItemStatus.Reject) {
          const idStr = item.dishId.toString()
          if (itemQuantityMap.has(idStr)) {
            // Nếu đã có, cộng dồn số lượng
            itemQuantityMap.set(idStr, itemQuantityMap.get(idStr)! + item.quantity)
          } else {
            // Nếu chưa có, set số lượng ban đầu và push vào mảng ID để query DB
            itemQuantityMap.set(idStr, item.quantity)
            uniqueDishIds.push(item.dishId)
          }
        }
      })
    }

    // Query DB để lấy tên và ảnh món ăn
    // Chỉ lấy các trường cần thiết: _id, name, image
    const dishesInfo = await databaseService.dishes
      .find({ _id: { $in: uniqueDishIds } })
      .project({ name: 1, image: 1 })
      .toArray()

    // Map dữ liệu để ra đúng format yêu cầu
    const formattedItems = dishesInfo.map((dish) => ({
      dishId: dish._id.toString(),
      dishName: dish.name,
      quantity: itemQuantityMap.get(dish._id.toString()) || 0,
      image: dish.image
    }))

    // console.log("formattedItems: ", formattedItems) // đã lọc
    // [REAL-TIME] Bắn Socket thông báo
    const io = getIO()

    // a. Báo cho khách (Tại bàn đó) -> Để màn hình QR chuyển sang "Thành công"
    io.to(`table_${order.tableId}`).emit("payment_success", {
      orderId: orderIdRaw,
      amount: transferAmount,
      message: "Thanh toán thành công!",
      items: formattedItems
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

  async getPaymentUrl({ orderId }: { orderId: string }) {
    const order = await databaseService.orders.findOne({ _id: new ObjectId(orderId) })

    if (!order) {
      throw new ErrorWithStatus({ message: USER_MESSAGES.ORDER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
    }
    const flag = order.items.some(
      (item) => item.status === OrderItemStatus.Pending || item.status === OrderItemStatus.Cooking
    )
    if (flag) {
      throw new ErrorWithStatus({
        message: "Tồn tại đơn hàng chưa phục vụ. Chưa thể thanh toán",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const qrUrl = generatePaymentQR({
      amount: order.totalAmount,
      des: `DH ${order._id.toString()}`
    })

    return qrUrl
  }
}

const paymentService = new PaymentService()
export default paymentService
