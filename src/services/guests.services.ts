import databaseService from "../services/database.servies"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { signToken } from "../utils/jwt"
import {
  DishCategoryStatus,
  DishStatus,
  OrderItemStatus,
  OrderStatus,
  ROLE_GUEST,
  TableStatus,
  TokenType
} from "../constants/enums"
import { getIO } from "../utils/socket"
import { ObjectId } from "mongodb"
import Dish from "../models/schema/Dish.schema"
import Order from "../models/schema/Order.schema"

interface DishItemInputFE {
  dishId: string
  quantity: number
  note: string
}
class GuestService {
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
        const result = await databaseService.ingredients.updateOne(
          {
            _id: new ObjectId(ingredientId),
            currentStock: { $gte: quantity }
          },
          {
            $inc: { currentStock: -quantity }
          },
          { session }
        )
        // console.log(result)
        if (result.matchedCount === 0) {
          throw new ErrorWithStatus({
            message: `Nguyên liệu ID ${ingredientId} không đủ tồn kho`,
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

  async getMenu() {
    const menu = await databaseService.dish_categories
      .aggregate([
        {
          $match: {
            status: DishCategoryStatus.ACTIVE
          }
        },
        {
          $sort: { display_order: 1 }
        },
        {
          $lookup: {
            from: "dishes",
            localField: "_id",
            foreignField: "categoryId",
            pipeline: [
              {
                $match: {
                  status: { $in: [DishStatus.AVAILABLE, DishStatus.UNAVAILABLE] },
                  deleted: { $ne: true }
                }
              },
              {
                $sort: { isFeatured: -1, createdAt: -1 }
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  price: 1,
                  image: 1,
                  description: 1,
                  status: 1,
                  isFeatured: 1
                }
              }
            ],
            as: "dishes"
          }
        },
        {
          $match: {
            dishes: { $not: { $size: 0 } }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            image: 1,
            dishes: 1
          }
        }
      ])
      .toArray()

    return menu
  }

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

    // try {
    //   await this.checkAndDeductStock(items, dishMap)
    // } catch (error) {
    //   // Nếu lỗi kho, dừng ngay lập tức, không tạo Order
    //   throw error
    // }

    const orderItems: any[] = []
    for (const item of items) {
      const dish = dishMap.get(item.dishId) as Dish
      orderItems.push({
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
    let orderResult

    if (table?.currentOrderId) {
      // Bàn Đang Ăn -> Cập nhật đơn cũ
      const currentOrderId = table.currentOrderId
      // console.log(currentOrderId)
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
        tableNumber: table?.number || 0,
        items: orderItems,
        totalAmount: 0,
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
    return orderResult
  }
}
const guestServices = new GuestService()
export default guestServices
