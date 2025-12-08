import { Server as HttpServer } from "http"
import { Server } from "socket.io"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { WHILELIST_DOMAINS } from "../index"
import { Socket } from "dgram"
import USER_MESSAGES from "../constants/message"
import { ROLE_GUEST } from "../constants/enums"
import { verifyToken } from "./jwt"
import { JsonWebTokenError } from "jsonwebtoken"

let io: Server

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: WHILELIST_DOMAINS
    }
  })

  // Kiểm tra token trước khi connect
  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    const { authorization } = socket.handshake.headers
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
        return next(new Error(`Unauthorized: ${error.message}`))
      }
      return next(new Error("Unauthorized: Invalid Token"))
    }
  })

  io.on("connection", (socket) => {
    const { permissions } = socket as any
    const { decoded_access_token } = socket as any

    console.log(`User ${socket.id} connected with permissions:`, permissions)

    // Gia nhập phòng bếp: admin
    socket.on("join_kitchen_room", () => {
      if (permissions.includes("socket_join_kitchen")) {
        socket.join("admin_room")
        console.log(`User ${decoded_access_token.user_id} joined Kitchen Room`) // user_id đây là id của người dùng bên admin
        // Phản hồi cho client biết đã join thành công
        socket.emit("join_success", "Bạn đã vào phòng bếp")
      } else {
        console.log(`User ${decoded_access_token.user_id} cố tình vào bếp nhưng không có quyền`)
        socket.emit("error_msg", "Bạn không có quyền truy cập thông báo bếp!")
      }
    })

    // Khách join bàn
    socket.on("join_table", ({ tableId }) => {
      if (permissions.includes("socket_join_own_table")) {
        const roomName = `table_${tableId}`
        socket.join(roomName)
        console.log(`User ${socket.id} joined ${roomName}`) // socket.id là id do socket sinh ra cho người dùng
      }
    })

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
