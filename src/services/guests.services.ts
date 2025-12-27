import databaseService from "../services/database.servies"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { signToken } from "../utils/jwt"
import {
  BookingStatus,
  DishCategoryStatus,
  DishStatus,
  OrderItemStatus,
  ROLE_GUEST,
  TableStatus,
  TokenType
} from "../constants/enums"
import { getIO } from "../utils/socket"
import { ObjectId } from "mongodb"
import Dish from "../models/schema/Dish.schema"
import Order from "../models/schema/Order.schema"
import USER_MESSAGES from "../constants/message"
import { CreateBookingReqBody } from "../models/requests/Guest.request"
import { parseTimeToMinutes, removeAccents } from "../utils/helpers"
import Booking from "../models/schema/Booking.schema"

export interface DishItemInputFE {
  dishId: string
  quantity: number
  note: string
}
class GuestService {
  private async returnStock(dishId: string, quantity: number) {
    const dish = await databaseService.dishes.findOne({ _id: new ObjectId(dishId) })
    if (!dish || !dish.recipe) return

    const ingredientUpdates = new Map<string, number>()
    for (const recipeItem of dish.recipe) {
      const ingId = recipeItem.ingredientId.toString()
      const totalQuantity = recipeItem.quantity * quantity
      ingredientUpdates.set(ingId, totalQuantity)
    }

    if (ingredientUpdates.size === 0) return

    const session = databaseService.client.startSession()
    session.startTransaction()

    try {
      for (const [ingredientId, qty] of ingredientUpdates) {
        await databaseService.ingredients.updateOne(
          { _id: new ObjectId(ingredientId) },
          { $inc: { currentStock: qty } },
          { session }
        )
      }
      await session.commitTransaction()
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }

  private signAccessToken({
    user_id,
    tableNumber,
    guestName,
    role_name
  }: {
    user_id: string
    tableNumber: number
    guestName: string
    role_name: string
  }) {
    return signToken({
      payload: {
        user_id,
        tableNumber,
        token_type: TokenType.ACCESS_TOKEN,
        guestName,
        role_name
      },
      privateKey: process.env.PRIVATE_KEY_SIGN_ACCESS_TOKEN as string,
      optionals: {
        expiresIn: "5h"
      }
    })
  }

  private async checkAndDeductStock(items: any[], dishMap: Map<string, any>) {
    // Gom tất cả nguyên liệu cần thiết (Gom hết gà từ các đơn cần gà)
    const ingredientUpdates = new Map<string, number>()

    for (const item of items) {
      const dish = dishMap.get(item.dishId)
      if (dish && dish.recipe) {
        for (const recipeItem of dish.recipe) {
          const ingId = recipeItem.ingredientId.toString()
          const totalQuantity = recipeItem.quantity * item.quantity
          const currentQuantity = ingredientUpdates.get(ingId) || 0
          ingredientUpdates.set(ingId, currentQuantity + totalQuantity)
        }
      }
    }
    if (ingredientUpdates.size == 0) return

    // Transaction
    const session = databaseService.client.startSession()
    session.startTransaction()

    // console.log(ingredientUpdates)

    try {
      for (const [ingredientId, quantity] of ingredientUpdates) {
        // console.log(ingredientId)
        // console.log(quantity)
        const [result, ingredient] = await Promise.all([
          databaseService.ingredients.updateOne(
            {
              _id: new ObjectId(ingredientId),
              currentStock: { $gte: quantity }
            },
            {
              $inc: { currentStock: -quantity }
            },
            { session }
          ),
          databaseService.ingredients.findOne({
            _id: new ObjectId(ingredientId)
          })
        ])
        // console.log(result)
        if (result.matchedCount === 0) {
          throw new ErrorWithStatus({
            message: `Nguyên liệu ${ingredient?.name} cho món không đủ tồn kho. Vui lòng chọn món khác`,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
      }
      await session.commitTransaction()
    } catch (error) {
      await session.abortTransaction() // Nếu có bất kì 1 lỗi => Hủy toàn bộ các thay đổi trước đó
      throw error
    } finally {
      await session.endSession()
    }
  }

  async login({ guestName, qrToken }: { guestName: string; qrToken: string }) {
    const table = await databaseService.tables.findOne({ qrToken })

    if (!table) {
      throw new ErrorWithStatus({
        message: "Table not found or invalid QR token",
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const user_id = table._id.toString()

    const accessToken = await this.signAccessToken({
      user_id: user_id,
      tableNumber: table.number,
      guestName,
      role_name: ROLE_GUEST
    })

    let currentOrderId = null
    if (table.status === TableStatus.OCCUPIED && table.currentOrderId) {
      currentOrderId = table.currentOrderId
    }
    console.log("currentOrderId: ", currentOrderId)
    return {
      accessToken,
      guest: {
        id: table._id, // Trả về ID bàn
        guestName: guestName,
        tableNumber: table.number,
        status: table.status
      },
      currentOrderId // Frontend dựa vào đây để biết có cần load lại đơn cũ không
    }
  }
  // Lấy danh sách danh mục
  async getDishCategories() {
    const dishCategories = await databaseService.dish_categories
      .find(
        {
          status: DishCategoryStatus.ACTIVE
        },
        {
          projection: {
            createdAt: 0,
            updatedAt: 0,
            key_search: 0,
            image_id: 0
          }
        }
      )
      .toArray()
    return dishCategories
  }
  // Lấy danh sách đơn hàng
  async getMenu({
    categoryId,
    page,
    limit,
    rating,
    isFeatured,
    minPrice,
    maxPrice
  }: {
    categoryId: string
    page: number
    limit: number
    rating?: number
    isFeatured?: boolean
    minPrice?: number
    maxPrice?: number
  }) {
    const objectFind: any = {
      deleted: false,
      status: DishStatus.AVAILABLE,
      categoryId: new ObjectId(categoryId)
    }
    if (rating) {
      objectFind.ratingAverage = {
        $gte: rating
      }
    }
    if (isFeatured) {
      objectFind.isFeatured = isFeatured
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      objectFind.price = {}
      if (minPrice !== undefined) objectFind.price.$gte = minPrice // Lớn hơn hoặc bằng
      if (maxPrice !== undefined) objectFind.price.$lte = maxPrice // Nhỏ hơn hoặc bằng
    }
    // console.log(objectFind)
    const [menu, total] = await Promise.all([
      databaseService.dishes
        .find(objectFind, {
          projection: {
            name_search: 0,
            deleted: 0,
            deletedAt: 0,
            createdAt: 0,
            updatedAt: 0
          }
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      databaseService.dishes.countDocuments(objectFind)
    ])
    return {
      menu,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
  // Khách tạo mới đơn hàng
  async createOrder({ tableId, guestName, items }: { tableId: string; guestName: string; items: DishItemInputFE[] }) {
    // Lấy thông tin Món ăn từ DB (Để lấy giá và recipe chuẩn)
    const dishIds = items.map((item) => new ObjectId(String(item.dishId)))
    const dishes = await databaseService.dishes
      .find(
        { _id: { $in: dishIds } },
        {
          projection: {
            name_search: 0,
            deleted: 0,
            deletedAt: 0,
            createdAt: 0,
            updatedAt: 0
          }
        }
      )
      .toArray()
    const dishMap = new Map(dishes.map((d) => [d._id.toString(), d]))

    for (const item of items) {
      const dish = dishMap.get(item.dishId)
      if (!dish || dish.status === DishStatus.HIDDEN || dish.status === DishStatus.UNAVAILABLE) {
        throw new ErrorWithStatus({
          message: `Dish '${dish?.name || item.dishId}' is not available`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    await this.checkAndDeductStock(items, dishMap)

    const orderItems: any[] = []
    for (const item of items) {
      const dish = dishMap.get(item.dishId) as Dish
      orderItems.push({
        _id: new ObjectId(),
        dishId: dish._id,
        dishName: dish.name,
        dishPrice: dish.price,
        dishImage: dish.image,
        quantity: item.quantity,
        note: item.note || "",
        orderedBy: guestName,
        status: OrderItemStatus.Pending,
        createdAt: new Date()
      })
    }

    const tableObjectId = new ObjectId(tableId)
    // console.log(tableId)
    const table = await databaseService.tables.findOne({ _id: tableObjectId })
    if (!table) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.TABLE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    let orderResult

    if (table.currentOrderId) {
      // Bàn Đang Ăn -> Cập nhật đơn cũ
      const currentOrderId = table.currentOrderId
      const additionalAmount = orderItems.reduce((acc, item) => acc + item.dishPrice * item.quantity, 0)

      await databaseService.orders.updateOne(
        { _id: currentOrderId },
        {
          $push: { items: { $each: orderItems } as any },
          $inc: { totalAmount: additionalAmount },
          $set: { updatedAt: new Date() }
        }
      )
      orderResult = await databaseService.orders.findOne({ _id: currentOrderId })
    } else {
      // Bàn Mới -> Tạo đơn mới
      const newOrder = new Order({
        tableId: tableObjectId,
        tableNumber: table.number,
        items: orderItems,
        guestName: guestName
      })

      const insertNewOrder = await databaseService.orders.insertOne(newOrder)
      orderResult = { ...newOrder, _id: insertNewOrder.insertedId }

      await databaseService.tables.updateOne(
        { _id: tableObjectId },
        {
          $set: {
            status: TableStatus.OCCUPIED,
            currentOrderId: insertNewOrder.insertedId
          }
        }
      )
    }
    try {
      const io = getIO()
      // gửi thông báo đến cho admin
      io.to("admin_room").emit("new_order:admin", {
        type: "NEW_ORDER_CREATED:ADMIN",
        message: `Bàn ${table?.number} vừa đặt món mới`
      })

      // const orderId = orderResult?._id as ObjectId
      // const items = await databaseService.orders.find({ _id: new ObjectId(orderId) }).toArray()
      io.to("admin_room").emit("order_update:admin", { order: orderResult?.items })
      // Gửi thông báo đến khách trong bàn ăn được đặt
      io.to(`table_${tableId}`).emit("new_order:guest", {
        type: "NEW_ORDER_CREATED:CLIENT",
        message: "Đặt món thành công",
        data: orderResult
      })
      // console.log("orderResult: ", orderResult)
    } catch (error) {
      // Nếu socket lỗi, khách vẫn đặt món thành công
      console.error("Socket emit error:", error)
    }
    return orderResult
  }
  // Khách cập nhật trạng thái đơn hàng
  async cancelItemByGuest({
    orderId,
    itemId,
    tableId,
    status,
    guestName
  }: {
    orderId: string
    itemId: string
    tableId: string
    status: OrderItemStatus
    guestName: string
  }) {
    // Kiểm tra tính hợp lệ của đơn hàng
    const originalOrder = await databaseService.orders.findOne({
      _id: new ObjectId(orderId),
      "items._id": new ObjectId(itemId)
    })
    if (!originalOrder) {
      throw new ErrorWithStatus({
        message: "Order not found",
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (originalOrder.tableId.toString() !== tableId) {
      throw new ErrorWithStatus({
        message: "Bạn không có quyền hủy đơn của bàn khác",
        status: HTTP_STATUS.FORBIDDEN
      })
    }
    // lấy ra đơn hàng định cập nhật
    const originalItem = originalOrder.items.find((i) => i._id.toString() === itemId)
    if (!originalItem) {
      throw new ErrorWithStatus({ message: "Item not found", status: HTTP_STATUS.NOT_FOUND })
    }
    // Chỉ được hủy đơn hàng khi đang ở trạng thái pending
    if (originalItem.status === OrderItemStatus.Reject) {
      throw new ErrorWithStatus({
        message: "Món ăn đã được hủy",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    // Chỉ được hủy đơn hàng khi đang ở trạng thái pending
    if (originalItem.status !== OrderItemStatus.Pending) {
      throw new ErrorWithStatus({
        message: "Món ăn đang được chế biến hoặc đã phục vụ, không thể hủy!",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // hoàn kho
    await this.returnStock(originalItem.dishId.toString(), originalItem.quantity)
    // hoàn tiền
    const refundAmount = originalItem.dishPrice * originalItem.quantity

    const result = await databaseService.orders.findOneAndUpdate(
      {
        _id: new ObjectId(orderId),
        "items._id": new ObjectId(itemId)
      },
      {
        $set: {
          "items.$.status": status,
          "items.$.updatedAt": new Date()
        },
        $push: {
          "items.$.processingHistory": {
            status: status,
            updatedBy: guestName,
            updatedAt: new Date()
          }
        },
        // Trừ tiền
        $inc: { totalAmount: -refundAmount }
      },
      {
        returnDocument: "after"
      }
    )
    if (!result) {
      throw new ErrorWithStatus({ message: "Cancel failed", status: HTTP_STATUS.BAD_REQUEST })
    }

    const socketPayload = {
      orderId,
      itemId,
      status,
      mamageBy: guestName,
      newTotalAmount: result.totalAmount // Trả về tổng tiền mới
    }

    const io = getIO()

    // Gửi cho Admin (để bếp biết mà đừng nấu nữa)
    io.to("admin_room").emit("update_order_item", {
      ...socketPayload,
      message: `Khách hàng ${guestName} tại bàn ${result.tableNumber} đã HỦY món: ${originalItem.dishName} số lượng ${originalItem.quantity}`
    })
    io.to("admin_room").emit("order_update:admin", { orders: result })

    // Gửi lại cho chính bàn đó (để update UI cho các thành viên khác trong bàn)
    // io.to(`table_${tableId}`).emit("update_order_item", socketPayload)
    io.to(`table_${tableId}`).emit("order:update", result) // trả về toàn bộ đơn hàng để cập nhật đồng thời các tab

    return socketPayload
  }
  // Khách lấy danh sách đơn hàng
  async getOrderList({ tableId }: { tableId: string }) {
    const table = await databaseService.tables.findOne({ _id: new ObjectId(tableId) })
    if (!table || !table.currentOrderId) {
      return {
        [OrderItemStatus.Pending]: [],
        [OrderItemStatus.Cooking]: [],
        [OrderItemStatus.Served]: [],
        [OrderItemStatus.Reject]: []
      }
    }

    const order = await databaseService.orders.findOne({
      _id: new ObjectId(table.currentOrderId)
    })

    if (!order) {
      return {
        [OrderItemStatus.Pending]: [],
        [OrderItemStatus.Cooking]: [],
        [OrderItemStatus.Served]: [],
        [OrderItemStatus.Reject]: []
      }
    }

    const groupItems: Record<string, any[]> = {
      [OrderItemStatus.Pending]: [],
      [OrderItemStatus.Cooking]: [],
      [OrderItemStatus.Served]: [],
      [OrderItemStatus.Reject]: []
    }

    order.items.forEach((item) => {
      if (groupItems[item.status]) {
        groupItems[item.status].push(item)
      }
    })

    return groupItems
  }

  // BOOKING
  async createBooking({ name, phone, bookingDate, bookingTime, guestNumber, note }: CreateBookingReqBody) {
    // Số bàn trống[] = Số bàn thỏa mãn (chỗ ngồi) - số bàn đã được booking trong thời gian đó
    const MEAL_DURATION_MINUTES = 120 // Cấu hình cứng là 120p cho một phiên ăn
    // Số bàn trống
    const totalSuitableTables = await databaseService.tables.countDocuments({
      capacity: { $gte: guestNumber }
    })

    if (!totalSuitableTables) {
      throw new ErrorWithStatus({
        message: `Rất tiếc, nhà hàng không có bàn nào đủ chỗ cho ${guestNumber} người trong khung giờ ${bookingTime} ngày ${bookingDate}.`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Số bàn (đã đặt cọc hoặc chờ duyệt) trong thời gian đó => Tìm trong danh sách booking của ngày hôm đó
    const bookingDateObj = new Date(bookingDate)
    const startOfDay = new Date(bookingDateObj.setHours(0, 0, 0, 0))
    const endOfDay = new Date(bookingDateObj.setHours(23, 59, 59, 99))
    // Lấy ra các booking trong ngày hôm đó
    const activeBookings = await databaseService.bookings
      .find({
        bookingDate: { $gte: startOfDay, $lte: endOfDay }, // trong ngày hôm đó
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }, // trạng thái chờ duyệt hoặc đã xác nhận
        guestCount: { $lte: Number(guestNumber) + 2 }
      })
      .toArray()

    const reqTimesToMinutes = parseTimeToMinutes(bookingTime)
    let overlappingCount = 0
    for (const booking of activeBookings) {
      const existingTimeMinutes = parseTimeToMinutes(booking.bookingTime)
      if (Math.abs(existingTimeMinutes - reqTimesToMinutes) < MEAL_DURATION_MINUTES) {
        overlappingCount++
      }
    }
    if (overlappingCount >= totalSuitableTables) {
      throw new ErrorWithStatus({
        message: `Rất tiếc, khung giờ ${bookingTime} đã hết bàn phù hợp. Vui lòng chọn giờ khác.`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Nếu thỏa mãn => Tạo mới booking
    const newBooking = new Booking({
      guestInfo: {
        name,
        phone
      },
      bookingDate: new Date(bookingDate),
      bookingTime: bookingTime,
      guestNumber: guestNumber,
      note: note,
      status: BookingStatus.PENDING,
      key_search: removeAccents(name + " " + phone)
    })
    const result = await databaseService.bookings.insertOne(newBooking)
    // SOCKET
    const io = getIO()
    io.to("admin_room").emit("new_booking_notification", {
      bookingId: result.insertedId,
      guestName: name,
      bookingTime: `${bookingTime} ngày ${bookingDate}`,
      guestNumber: guestNumber,
      message: `🔔 Có đơn đặt bàn mới: ${name} (${guestNumber} khách) lúc ${bookingTime}`
    })
    return result.insertedId
  }
  // END BOOKING
}
const guestServices = new GuestService()
export default guestServices
