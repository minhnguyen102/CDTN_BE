import { Server as HttpServer } from "http"
import { Server } from "socket.io"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { WHILELIST_DOMAINS } from "../index"

let io: Server

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: WHILELIST_DOMAINS
    }
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    // Logic join room bàn ăn (để nhận thông báo riêng cho bàn)
    socket.on("join_table", (tableId) => {
      socket.join(`table_${tableId}`)
      console.log(`${socket.id} joined table_${tableId}`)
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
