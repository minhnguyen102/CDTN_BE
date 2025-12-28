import { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { WHILELIST_DOMAINS } from "../index"
import USER_MESSAGES from "../constants/message"
import { OrderItemStatus, PaymentMethod, PaymentStatus, ROLE_GUEST, TableStatus } from "../constants/enums"
import { verifyToken } from "./jwt"
import { JsonWebTokenError } from "jsonwebtoken"
import { config } from "dotenv"
import orderServices from "../services/orders.services"
import { CreateOrderPayload, GetOrderList, PayByCash } from "../models/requests/Order.request"
import guestServices from "../services/guests.services"
import databaseService from "../services/database.servies"
import { ObjectId } from "mongodb"
import Order from "../models/schema/Order.schema"
config()

let io: Server

interface CustomSocket extends Socket {
  decoded_access_token?: any
  permissions?: string[]
}

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: WHILELIST_DOMAINS
    }
  })

  // Kiểm tra token trước khi connect
  io.use(async (socket: CustomSocket, next) => {
    const { Authorization } = socket.handshake.auth
    const { authorization } = socket.handshake.headers
    // console.log("Au", Authorization) // k co
    // console.log("au", authorization) // co
    const access_token = (Authorization || authorization || "").split(" ")[1]
    try {
      if (!access_token) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
      const decoded_access_token = await verifyToken({
        token: access_token,
        secretOrPublicKey: process.env.PRIVATE_KEY_SIGN_ACCESS_TOKEN as string
      })
      // console.log("decoded_access_token: ", decoded_access_token)
      const { role_name } = decoded_access_token
      let permissions: string[] = []

      if (role_name === ROLE_GUEST) {
        permissions = ["socket_join_own_table"]
      } else {
        permissions = decoded_access_token.permissions
      }
      // console.log("permissions: ", permissions)
      ;(socket as any).decoded_access_token = decoded_access_token
      ;(socket as any).permissions = permissions
      next()
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        return next(new Error(`Unauthorized 1: ${error.message}`))
      }
      return next(new Error("Unauthorized: Invalid Token"))
    }
  })

  io.on("connection", (socket) => {
    const { permissions } = socket as any
    const { decoded_access_token } = socket as any
    console.log("decoded_access_token: ", decoded_access_token)
    console.log(`User ${socket.id} connected with permissions:`, permissions)

    // ADMIN
    // Gia nhập phòng bếp: admin
    socket.on("join_kitchen_room", () => {
      if (permissions.includes("socket_join_kitchen")) {
        socket.join("admin_room")
        console.log(`User ${decoded_access_token.user_id} joined Kitchen Room`) // user_id đây là id của người dùng bên admin
        // Phản hồi cho client biết đã join thành công
        socket.emit("join_success", { message: "Bạn đã vào phòng bếp", roomId: "admin_room" })
      } else {
        console.log(`User ${decoded_access_token.user_id} cố tình vào bếp nhưng không có quyền`)
        socket.emit("error_msg", "Bạn không có quyền truy cập thông báo bếp!")
      }
    })
    // server bắt sự kiện admin cập nhật đơn hàng
    socket.on("update_order_status:admin", async (payload, callback) => {
      const { orderId, itemId, status } = payload

      try {
        await orderServices.updateItemStatus({
          orderId,
          itemId,
          status,
          admin_id: decoded_access_token.user_id
        }) // đã xử lí socket bên này. Có thể làm sang bên này không?
        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Cập nhật trạng thái món thành cồng"
          })
        }
      } catch (error: any) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message
          })
        }
      }
    })
    // server bắt sự kiện admin tạo đơn cho khách
    socket.on("create_order:admin", async (payload: CreateOrderPayload, callback) => {
      const { tableId, guestName, items } = payload // Nội dung FE cần gửi
      const { user_id } = decoded_access_token
      try {
        await orderServices.createOrderForTable({
          tableId,
          guestName,
          items,
          adminId: user_id
        }) // trong đây đã có gửi sự kiện cho admin và guest
        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Tạo mới đơn hàng cho khách thành công"
          })
        }
      } catch (error: any) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message
          })
        }
      }
    })
    // server bắt sự kiện admin xác nhận thanh toán bằng tiềt mặt cho bàn ăn (đã nhận tiền mặt)
    socket.on("confirmed_pay_by_cash:admin", async (payload: PayByCash, callback) => {
      const orderId = new ObjectId(payload.orderId)
      const order = (await databaseService.orders.findOne({
        _id: orderId
      })) as Order
      // Kiểm tra Idempotency (Tránh xử lý lại đơn đã thanh toán)
      if (order.paymentStatus === PaymentStatus.PAID) {
        return { success: true, message: "Order already paid" }
      }
      // Kiểm tra trạng thái các món của đơn => Nếu có đơn chưa phục vụ => chưa cho thanh toán
      const flag = order.items.some(
        (item) => item.status === OrderItemStatus.Pending || item.status === OrderItemStatus.Cooking
      )
      // [REAL-TIME] Bắn Socket thông báo
      const io = getIO()
      if (flag) {
        io.to("admin_room").emit("payment_reject", {
          message: "Tồn tại đơn hàng chưa phục vụ. Chưa thể thanh toán",
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      // Update Database (Chuyển trạng thái thành PAID, chuyển trạng thái, currentOrderId của bàn)
      await Promise.all([
        await databaseService.orders.updateOne(
          { _id: orderId },
          {
            $set: {
              paymentStatus: PaymentStatus.PAID,
              paymentMethod: PaymentMethod.CASH,
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

      // a. Báo cho khách (Tại bàn đó) -> Để màn hình QR chuyển sang "Thành công"
      io.to(`table_${order.tableId}`).emit("payment_success", {
        orderId: payload.orderId,
        amount: order.totalAmount,
        message: "Thanh toán thành công!",
        items: formattedItems
      })

      // b. Báo cho Admin/Bếp (Để biết đơn đã trả tiền)
      io.to("admin_room").emit("payment_received", {
        orderId: payload.orderId,
        tableNumber: order.tableNumber,
        amount: order.totalAmount,
        message: `Bàn ${order.tableNumber} vừa thanh toán ${order.totalAmount.toLocaleString()}đ bằng tiền mặt`
      })
    })
    // END ADMIN

    // GUEST
    // Khách join bàn
    socket.on("join_table", ({ tableId }) => {
      if (permissions.includes("socket_join_own_table")) {
        const roomName = `table_${tableId}`
        socket.join(roomName)
        console.log(`User ${socket.id} joined ${roomName}`) // socket.id là id do socket sinh ra cho người dùng
      }
    })
    // Server bắt sự kiện khách tạo mới đơn hàng
    socket.on("create_order:guest", async (payload: CreateOrderPayload, callback) => {
      // tableId, guestName lấy từ decode_access_token
      const { tableId, guestName, items } = payload
      try {
        const newOrder = await guestServices.createOrder({ tableId, guestName, items })
        if (typeof callback === "function") {
          callback({
            success: true,
            message: USER_MESSAGES.CREATE_ORDER_SUCCESS
          })
        }
      } catch (error: any) {
        console.error(error)

        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message || "Lỗi server"
          })
        }
      }
    })
    // Server bắt sự kiện khách cập nhật trạng thái đơn hàng (Chỉ được phép từ pending -> reject)
    socket.on("cancel_order:guest", async (payload, callback) => {
      const { orderId, itemId, status } = payload
      const { user_id, guestName } = decoded_access_token

      try {
        const result = await guestServices.cancelItemByGuest({
          orderId,
          itemId,
          tableId: user_id, // Truyền vào để service check security
          status,
          guestName
        })
        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Hủy món thành công",
            data: result
          })
        }
      } catch (error: any) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message || "Lỗi server"
          })
        }
      }
    })
    // Server bắt sự kiện khách nhấn nút theo dõi trạng thái đơn hàng => trả về toàn bộ danh sách đơn hàng có phân chia theo 4 nhóm
    socket.on("get_orders:guest", async (payload: GetOrderList, callback) => {
      const { tableId } = payload
      try {
        const groupItems = await guestServices.getOrderList({ tableId })
        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Lấy danh sách đơn hàng thành công",
            data: groupItems
          })
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ success: false, message: "Lỗi lấy đơn hàng" })
        }
      }
    })
    // server bắt sự kiện khách muốn thanh toán bằng tiền mặt
    socket.on("pay_by_cash:guest", async (payload: PayByCash, callback) => {
      const { orderId } = payload
      try {
        const order = (await databaseService.orders.findOne({
          _id: new ObjectId(orderId)
        })) as Order
        const { tableNumber } = order
        io.to("admin_room").emit("pay_by_cash_notification", {
          message: `Bàn ${tableNumber} muốn thanh toán bằng tiền mặt.`
        })
        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Vui lòng đợi tại bàn, nhân viên sẽ đến thu tiền"
          })
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ success: false, message: "Lỗi thanh toán" })
        }
      }
    })
    // END GUEST

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })
  })

  return io
}

// Hàm này giúp Service lấy được biến 'io' để bắn thông báo
export const getIO = () => {
  if (!io) {
    throw new ErrorWithStatus({
      message: "Socket.io not initialized!",
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
  return io
}
