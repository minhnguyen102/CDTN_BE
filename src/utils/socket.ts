import { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { WHILELIST_DOMAINS } from "../index"
import USER_MESSAGES from "../constants/message"
import { ROLE_GUEST } from "../constants/enums"
import { verifyToken } from "./jwt"
import { JsonWebTokenError } from "jsonwebtoken"
import { config } from "dotenv"
import orderServices from "../services/orders.services"
import { CreateOrderPayload, GetOrderList } from "../models/requests/Order.request"
import guestServices from "../services/guests.services"
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
      // check permission
      // if (!permissions.includes("update_order_status")) {
      //   if (typeof callback === "function") {
      //     return callback({ success: false, message: "Bạn không có quyền thực hiện!" })
      //   }
      //   return
      // }

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
            message: "Order created/updated successfully"
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
