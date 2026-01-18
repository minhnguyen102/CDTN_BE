import { ObjectId } from "mongodb"
import { DishStatus, OrderItemStatus, PaymentStatus, TableStatus } from "../constants/enums"
import databaseService from "./database.servies"
import { getIO } from "../utils/socket"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { update } from "lodash"
import Account from "../models/schema/Account.schema"
import USER_MESSAGES from "../constants/message"
import Dish from "../models/schema/Dish.schema"
import Order from "../models/schema/Order.schema"
import ingredientServices from "./ingredients.services"

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
        const [result, ingredient] = await Promise.all([
          databaseService.ingredients.updateOne(
            { _id: new ObjectId(ingredientId), currentStock: { $gte: quantity } },
            {
              $inc: { currentStock: -quantity }
            },
            { session }
          ),
          databaseService.ingredients.findOne({
            _id: new ObjectId(ingredientId)
          })
        ])
        if (result.matchedCount === 0) {
          throw new ErrorWithStatus({
            message: `Nguyên liệu ${ingredient?.name} cho món ăn không đủ tồn kho. Vui lòng chọn món khác`,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
      }
      await session.commitTransaction()
      // Emit alerts for low stock after transaction success
      for (const [ingredientId] of ingredientUpdates) {
        ingredientServices.checkAndEmitLowStockAlert(ingredientId).catch(err => {
          console.error(`Error emitting low stock alert for ${ingredientId}:`, err)
        })
      }
    } catch (error) {
      await session.abortTransaction() // Nếu có bất kì 1 lỗi => Hủy toàn bộ các thay đổi trước đó
      throw error
    } finally {
      await session.endSession()
    }
  }
  // Dùng khi khách hàng hủy món (điều kiện món đang ở trạng thái pending)
  private async returnStock({ dishId, quantity }: { dishId: string; quantity: number }) {
    const dish = await databaseService.dishes.findOne({
      _id: new ObjectId(dishId)
    })
    if (!dish || !dish.recipe) return

    const ingredientUpdates = new Map<string, number>()
    for (const recipeItem of dish.recipe) {
      const ingId = recipeItem.ingredientId.toString()
      const totalQuantity = recipeItem.quantity * quantity // số lượng cho 1 phần ăn * số suất đặt
      ingredientUpdates.set(ingId, totalQuantity)
    }

    if (ingredientUpdates.size === 0) return
    const session = databaseService.client.startSession()
    session.startTransaction()

    try {
      for (const [ingredientId, quantity] of ingredientUpdates) {
        await databaseService.ingredients.updateOne(
          { _id: new ObjectId(ingredientId) },
          { $inc: { currentStock: quantity } },
          { session }
        )
      }
      await session.commitTransaction()
      console.log(`Đã hoàn kho cho món ${dish.name}`)
    } catch (error) {
      await session.abortTransaction()
      console.log("Lỗi hoàn kho", error)
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
    const match: any = {
      paymentStatus: PaymentStatus.UNPAID
    }

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

    // lấy totalAmount theo trạng thái đơn hàng
    if (status) {
      orders.forEach((order) => {
        const items = order.items
        const totalAmount = items.reduce((total: number, item: any) => total + item.dishPrice * item.quantity, 0)
        order.totalAmount = totalAmount
      })
    }
    return {
      orders,
      total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async getAllOrdersHistory({
    limit,
    page,
    search,
    dateFrom,
    dateTo
  }: {
    limit: number
    page: number
    search?: string
    dateFrom?: string
    dateTo?: string
  }) {
    const match: any = {
      paymentStatus: PaymentStatus.PAID
    }
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

    const queryPipeline: any[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          tableId: 0,
          paymentStatus: 0,
          updatedAt: 0,

          "items._id": 0,
          "items.dishImage": 0,
          "items.note": 0,
          "items.orderedBy": 0,
          "items.managedBy": 0,
          "items.processingHistory": 0,
          "items.updatedAt": 0,
          "items.createdAt": 0
          // "items.status": 0 Phải trả về status thì bên dưới mới làm sạch dữ liệu được
        }
      }
    ]
    const [rawOrders, total] = await Promise.all([
      databaseService.orders.aggregate(queryPipeline).toArray(),
      databaseService.orders.countDocuments(match)
    ])

    const processedOrders = rawOrders.map((order: any) => {
      if (!order.items || order.items.length === 0) return order
      // Làm sạch dữ liệu => Không lấy những item có trạng thái đơn là Reject
      const validItems = order.items.filter((item: any) => {
        return item.status !== OrderItemStatus.Reject
      })
      if (validItems.length === 0) {
        return { ...order, items: [] }
      }

      // Map dùng để gom nhóm: Key là dishId, Value là item object
      const itemsMap = new Map<string, any>()

      validItems.forEach((item: any) => {
        const idKey = item.dishId.toString()

        if (itemsMap.has(idKey)) {
          const existingItem = itemsMap.get(idKey)
          existingItem.quantity += item.quantity
        } else {
          itemsMap.set(idKey, { ...item })
        }
      })
      Array.from(itemsMap.values()).forEach((item) => {
        item.subTotal = item.dishPrice * item.quantity
      })
      // Mỗi order là 1 object => Cần trả về một object khi map, chỉ xử lí gom item giống nhau vào thôi
      return {
        ...order,
        items: Array.from(itemsMap.values())
      }
    })

    const totalRevenue = processedOrders.reduce((total, order) => total + order.totalAmount, 0)

    return {
      orders: processedOrders,
      meta: {
        totalRevenue,
        count: total
      },
      pagination: {
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getDetailOrderHistory({ order_id }: { order_id: string }) {
    const orderDetail = await databaseService.orders.findOne(
      {
        _id: new ObjectId(order_id),
        paymentStatus: PaymentStatus.PAID
      },
      {
        projection: {
          // "items.dishId": 0,
          _id: 0,
          tableId: 0,
          tableNumber: 0,
          guestName: 0,
          totalAmount: 0,
          createdAt: 0,
          paymentStatus: 0,
          paymentMethod: 0,
          updatedAt: 0,
          finishedAt: 0
        }
      }
    )

    if (!orderDetail) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ORDER_NOT_FOUND_OR_NOT_PAID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    const validItems = orderDetail.items.filter((item) => item.status !== OrderItemStatus.Reject)
    const itemsMap = new Map<string, any>()
    for (const item of validItems) {
      const dishIdString = item.dishId.toString()
      if (itemsMap.has(dishIdString)) {
        itemsMap.get(dishIdString).quantity += item.quantity // Cộng dồn
      } else {
        itemsMap.set(dishIdString, { ...item })
      }
    }
    const result = Array.from(itemsMap.values())
    return {
      items: result
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
    // Validate status gửi lên
    const statusAccept = Object.values(OrderItemStatus)
    if (!statusAccept.includes(status)) {
      throw new ErrorWithStatus({
        message: "Invalid status",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Tìm người cập nhật (ghi lại trong log)
    const account = (await databaseService.accounts.findOne({ _id: new ObjectId(admin_id) })) as Account

    // tìm bản ghi ban đầu để so sánh trạng thái ban đầu với trạng thái người gửi lên
    const originalOrder = (await databaseService.orders.findOne({
      _id: new ObjectId(orderId),
      "items._id": new ObjectId(itemId)
    })) as Order
    const originalItem = originalOrder?.items.find((i) => i._id.toString() === itemId)
    if (!originalItem) {
      throw new ErrorWithStatus({
        message: "Item not found",
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // xử lí ràng buộc (chỉ cho cập nhật lên)
    if (originalItem.status === status) return

    // Tạo thứ tự ưu tiên của trạng thái
    const priority: Record<string, number> = {
      [OrderItemStatus.Pending]: 0,
      [OrderItemStatus.Cooking]: 1,
      [OrderItemStatus.Served]: 2,
      [OrderItemStatus.Reject]: -1 // Reject là trạng thái đặc biệt
    }
    const currentP = priority[originalItem.status]
    const newP = priority[status]

    // Luật 1: Nếu trạng thái món đã chốt (served hoặc reject) => Không được thay đổi
    if (originalItem.status === OrderItemStatus.Reject) {
      throw new ErrorWithStatus({
        message: "Món ăn đã được hủy, không thể thay đổi trạng thái!",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    if (originalItem.status === OrderItemStatus.Served) {
      throw new ErrorWithStatus({
        message: "Món ăn đã hoàn thành, không thể thay đổi trạng thái!",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Chỉ được reject khi pending
    if (status === OrderItemStatus.Reject) {
      // Chỉ được Reject khi đang Pending (Cooking cũng không được hủy theo yêu cầu của bạn)
      if (originalItem.status !== OrderItemStatus.Pending) {
        throw new ErrorWithStatus({
          message: "Chỉ có thể hủy món khi đang chờ xử lý (Pending)",
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    } else {
      if (newP <= currentP) {
        throw new ErrorWithStatus({
          message: "Quy trình không được phép quay ngược trạng thái (VD: Cooking -> Pending)",
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    /** Xử lí riêng nếu reject
     * Nếu ban đầu là Pending và sau đó sang reject
     *  - Hoàn nguyên liệu lại kho
     *  - Trừ tiền cho đơn hàng
     */
    let refundAmount = 0
    if (originalItem.status === OrderItemStatus.Pending && status === OrderItemStatus.Reject) {
      await this.returnStock({ dishId: originalItem.dishId.toString(), quantity: originalItem.quantity })
      refundAmount = originalItem.dishPrice * originalItem.quantity
    }

    // Cập nhật trạng thái đơn => trả về kết quả sau trạng thái cập nhật
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
        },
        $inc: { totalAmount: -refundAmount } // xử lí riêng nếu reject. NẾu không reject thì refundAmout = 0
      },
      {
        returnDocument: "after"
      }
    ) // trả về nguyên bản ghi gồm tất cả các món có trong bàn. => muốn lấy duy nhất thông tin món đang được cập nhật
    if (!result) {
      throw new ErrorWithStatus({
        message: "Update failed",
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
    const statusVN = statusMap[status]

    const socketPayload = {
      orderId,
      itemId,
      status,
      mamageBy: account.name,
      newTotalAmount: updateOrder.totalAmount,
      message: `Món ${itemDetail.dishName} (SL: ${itemDetail.quantity}) của ${itemDetail.orderedBy} đã chuyển sang: ${statusVN}`
    }

    /**
     * socketio:
     *  - Gửi thông báo về cho khách tại bàn ăn đó
     *  - Gửi thông báo về toàn bộ trang admin
     */
    const io = getIO()
    // to admin
    io.to("admin_room").emit("update_order_item", socketPayload)
    const items = await databaseService.orders.find({ _id: new ObjectId(orderId) }).toArray()
    io.to("admin_room").emit("order_update:admin", { order: items })
    // to guest
    if (updateOrder.tableNumber) {
      io.to(`table_${updateOrder.tableId}`).emit("update_order_item", socketPayload)
      io.to(`table_${updateOrder.tableId}`).emit("order:update", updateOrder)
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
        guestName: guestName
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
      const orderId = orderResult?._id as ObjectId
      const items = await databaseService.orders.find({ _id: new ObjectId(orderId) }).toArray()
      io.to("admin_room").emit("order_update:admin", { order: items })

      // Gửi thông báo đến khách trong bàn ăn được đặt
      io.to(`table_${tableId}`).emit("new_order:guest", {
        type: "NEW_ORDER_CREATED:CLIENT", // Hoặc 'NEW_ITEM', 'PAYMENT_SUCCESS'
        message: "Khách hàng vừa gọi món mới",
        data: orderResult
      })
    } catch (error) {
      // Nếu socket lỗi, khách vẫn đặt món thành công
      console.error("Socket emit error:", error)
    }
    return orderResult // trả về cho controller, nếu dùng socket thì không cần
  }

  async getWeeklyStatistics() {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)

    console.log(`📊 Lấy thống kê từ ${start.toISOString()} đến ${end.toISOString()}`)
    const [revenueStats, topDishes, badDishes, deadDishes, reviewStats] = await Promise.all([
      databaseService.orders
        .aggregate([
          {
            $match: {
              paymentStatus: PaymentStatus.PAID,
              finishedAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: null, // Không nhóm theo gì cả
              totalRevenue: { $sum: "$totalAmount" },
              totalOrders: { $count: {} }
            }
          }
        ])
        .toArray(),
      databaseService.orders
        .aggregate([
          {
            $match: {
              paymentStatus: PaymentStatus.PAID,
              finishedAt: { $gte: start, $lte: end }
            }
          },
          {
            $unwind: "$items"
          },
          {
            $match: {
              "items.status": { $ne: OrderItemStatus.Reject }
            }
          },
          {
            $group: {
              _id: "$items.dishId",
              dishName: { $first: "$items.dishName" },
              totalSold: { $sum: "$items.quantity" },
              revenue: { $sum: { $multiply: ["$items.dishPrice", "$items.quantity"] } }
            }
          },
          { $sort: { totalSold: -1 } },
          { $limit: 5 }
        ])
        .toArray(),
      databaseService.orders
        .aggregate([
          {
            $match: {
              paymentStatus: PaymentStatus.PAID,
              finishedAt: { $gte: start, $lte: end }
            }
          },
          { $unwind: "$items" },
          {
            $match: {
              "items.status": { $ne: OrderItemStatus.Reject }
            }
          },
          {
            $group: {
              _id: "$items.dishId",
              dishName: { $first: "$items.dishName" },
              totalSold: { $sum: "$items.quantity" }
            }
          },
          { $sort: { totalSold: 1 } },
          { $limit: 3 }
        ])
        .toArray(),
      databaseService.dishes
        .aggregate([
          {
            $match: {
              status: DishStatus.AVAILABLE
            }
          },

          {
            $lookup: {
              from: "orders",
              let: { dishId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $in: ["$$dishId", "$items.dishId"] },
                        { $gte: ["$finishedAt", start] },
                        { $lte: ["$finishedAt", end] },
                        { $eq: ["$paymentStatus", PaymentStatus.PAID] }
                      ]
                    }
                  }
                },

                { $limit: 1 }
              ],
              as: "salesData"
            }
          },

          {
            $match: {
              salesData: { $eq: [] }
            }
          },

          {
            $project: {
              _id: 1,
              name: 1,
              price: 1
            }
          },

          { $limit: 3 }
        ])
        .toArray(),
      databaseService.reviews
        .aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              averageRating: { $round: ["$averageRating", 1] },
              totalReviews: 1
            }
          }
        ])
        .toArray()
    ])
    const reviewData = reviewStats[0] || { averageRating: 0, totalReviews: 0 }
    return {
      range: {
        from: start.toLocaleDateString("vi-VN"),
        to: end.toLocaleDateString("vi-VN")
      },
      summary: revenueStats[0] || { totalRevenue: 0, totalOrders: 0 },
      performance: {
        bestSellers: topDishes,
        worstSellers: badDishes,
        zeroSales: deadDishes
      },
      customerFeedback: {
        averageRating: reviewData.averageRating,
        totalReviews: reviewData.totalReviews
      }
    }
  }
}
const orderServices = new OrderServices()
export default orderServices
