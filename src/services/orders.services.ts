import { ObjectId } from "mongodb"
import { DishStatus, OrderItemStatus, OrderStatus, TableStatus } from "../constants/enums"
import databaseService from "./database.servies"
import { getIO } from "../utils/socket"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { update } from "lodash"
import Account from "../models/schema/Account.schema"
import USER_MESSAGES from "../constants/message"
import Dish from "../models/schema/Dish.schema"
import Order from "../models/schema/Order.schema"

interface DishItemInputFE {
  dishId: string
  quantity: number
  note: string
}
class OrderServices {
  private async checkAndDeductStock(items: any[], dishMap: Map<string, any>) {
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
    if (ingredientUpdates.size === 0) return

    // Transaction
    const session = databaseService.client.startSession()
    session.startTransaction()

    try {
      for (const [ingredientId, quantity] of ingredientUpdates) {
        const result = await databaseService.ingredients.updateOne(
          { _id: new ObjectId(ingredientId), currentStock: { $gte: quantity } },
          {
            $inc: { currentStock: -quantity }
          }
        )
        if (result.matchedCount === 0) {
          throw new ErrorWithStatus({
            message: `Nguyên liệu ID ${ingredientId} không đủ tồn kho`,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
        await session.commitTransaction()
      }
    } catch (error) {
      await session.abortTransaction() // Nếu có bất kì 1 lỗi => Hủy toàn bộ các thay đổi trước đó
      throw error
    } finally {
      await session.endSession()
    }
  }

  async getAllOrders({
    limit,
    page,
    status,
    search,
    dateFrom,
    dateTo
  }: {
    limit: number
    page: number
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
  }) {
    const match: any = {}

    // Lọc theo trạng thái của món ăn, chứ không phải trạng thái đơn hàng
    // Ví dụ: ?status=Pending -> Chỉ lấy đơn đang chờ
    if (status) {
      match["items.status"] = status
    }
    // Phân trang (Pagination)
    const skip = (page - 1) * limit

    if (search) {
      match.tableNumber = Number(search)
    }

    if (dateFrom || dateTo) {
      match.createdAt = {}
      if (dateFrom) {
        match.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        match.createdAt.$lte = new Date(dateTo)
      }
    }

    const queryPipeline: any[] = [{ $match: match }, { $sort: { createdAt: 1 } }, { $skip: skip }, { $limit: limit }]
    // console.log(queryPipeline)
    if (status) {
      queryPipeline.push({
        $project: {
          tableId: 1,
          tableNumber: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          items: {
            $filter: {
              input: "$items",
              as: "item",
              cond: { $eq: ["$$item.status", status] }
            }
          }
        }
      })
    }
    // console.log(queryPipeline)
    const [orders, total] = await Promise.all([
      databaseService.orders.aggregate(queryPipeline).toArray(),
      databaseService.orders.countDocuments(match)
    ])
    return {
      orders,
      total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async updateItemStatus({
    orderId,
    itemId,
    status,
    admin_id
  }: {
    orderId: string
    itemId: string
    status: OrderItemStatus
    admin_id: string
  }) {
    const account = (await databaseService.accounts.findOne({ _id: new ObjectId(admin_id) })) as Account
    const result = await databaseService.orders.findOneAndUpdate(
      {
        _id: new ObjectId(orderId),
        "items._id": new ObjectId(itemId)
      },
      {
        $set: {
          "items.$.status": status, //Dấu $ đánh dấu vị trị tìm được
          "items.$.updatedAt": new Date(),
          "items.$.managedBy": account.name
        },
        $push: {
          "items.$.processingHistory": {
            status: status,
            updatedBy: account.name,
            updatedAt: new Date()
          }
        }
      },
      {
        returnDocument: "after"
      }
    )
    // console.log(result, orderId, itemId)

    if (!result) {
      throw new ErrorWithStatus({
        message: "Order or Item not found",
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updateOrder = result
    const itemDetail = updateOrder.items.find((item) => item._id.toString() === itemId)
    if (!itemDetail) {
      throw new ErrorWithStatus({
        message: "Item not found in items list",
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const statusMap: Record<string, string> = {
      [OrderItemStatus.Pending]: "Chờ xử lý",
      [OrderItemStatus.Cooking]: "Đang nấu",
      [OrderItemStatus.Served]: "Đã phục vụ",
      [OrderItemStatus.Reject]: "Từ chối"
    }
    const statusVN = statusMap[status] || status
    // Chưa check map chuẩn xác

    const socketPayload = {
      orderId,
      itemId,
      status,
      mamageBy: account.name,
      message: `Món ${itemDetail.dishName} (SL: ${itemDetail.quantity}) của ${itemDetail.orderedBy} đã chuyển sang: ${statusVN}`
    }

    /**
     * socketio:
     *  - Gửi thông báo về cho khách tại bàn ăn đó
     *  - Gửi thông báo về toàn bộ trang admin
     */
    const io = getIO()
    io.to("admin_room").emit("update_order_item", socketPayload) // to admin
    if (updateOrder.tableNumber) {
      io.to(`table_${updateOrder.tableId}`).emit("update_order_item", socketPayload)
    }
    return socketPayload
  }

  async createOrderForTable({
    tableId,
    guestName,
    items,
    adminId
  }: {
    tableId: string
    guestName: string
    items: DishItemInputFE[]
    adminId: string
  }) {
    const account = (await databaseService.accounts.findOne({ _id: new ObjectId(adminId) })) as Account
    // Kiểm tra nguyên liệu
    const dishIds = items.map((item) => new ObjectId(item.dishId))
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

    // Nguyen liệu đủ => Tạo đơn
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
        createdAt: new Date(),
        managedBy: account.name, // Vì đây là admin đặt hộ khách
        processingHistory: [
          {
            status: OrderItemStatus.Pending,
            updatedBy: account.name,
            updatedAt: new Date()
          }
        ]
      })
    }

    // Có đơn => Gán vào bàn (Kiểm tra bàn)
    const tableObjectId = new ObjectId(tableId)
    const table = await databaseService.tables.findOne({ _id: tableObjectId })
    if (!table) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.TABLE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    let orderResult
    if (table.currentOrderId) {
      // Nếu có đơn => Cập nhật đơn mới
      const currentOrderId = table.currentOrderId
      const additionalAmount = orderItems.reduce((acc, item) => acc + item.dishPrice * item.quantity, 0)

      await databaseService.orders.updateOne(
        { _id: currentOrderId },
        {
          $push: { items: { $each: orderItems } },
          $inc: { totalAmount: additionalAmount },
          $set: { updatedAt: new Date() }
        }
      )
      orderResult = await databaseService.orders.findOne({ _id: currentOrderId })
    } else {
      // Bàn trống => Tạo đơn mới
      const newOrder = new Order({
        tableId: tableObjectId,
        tableNumber: table.number,
        items: orderItems,
        status: OrderStatus.PENDING
      })
      const insertResult = await databaseService.orders.insertOne(newOrder)
      orderResult = { ...newOrder, _id: insertResult.insertedId }

      await databaseService.tables.updateOne(
        { _id: tableObjectId },
        {
          $set: {
            status: TableStatus.OCCUPIED,
            currentOrderId: insertResult.insertedId
          }
        }
      )
    }

    // Tạo đơn thành công => gửi thông báo
    try {
      const io = getIO()
      // gửi thông báo đến cho admin
      io.to("admin_room").emit("new_order", {
        type: "NEW_ORDER_CREATED",
        message: `Bàn ${table?.number} vừa đặt món`,
        data: orderResult
      })
      // Gửi thông báo đến khách trong bàn ăn được đặt
      io.to(`table_${tableId}`).emit("refresh_order", {
        type: "ORDER_UPDATED", // Hoặc 'NEW_ITEM', 'PAYMENT_SUCCESS'
        message: "Khách hàng vừa gọi món mới",
        data: orderResult
      })
    } catch (error) {
      // Nếu socket lỗi, khách vẫn đặt món thành công
      console.error("Socket emit error:", error)
    }
    return orderResult // trả về cho controller, nếu dùng socket thì không cần
  }
}
const orderServices = new OrderServices()
export default orderServices
