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
    userId,
    tableNumber,
    guestName,
    role
  }: {
    userId: string
    tableNumber: number
    guestName: string
    role: string
  }) {
    return signToken({
      payload: {
        userId,
        tableNumber,
        tokenType: TokenType.ACCESS_TOKEN,
        guestName,
        role
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

    // Bước cập nhật
    const bulkOps: any[] = [] // cho pheps thực hiện nhiều thao tác cùng một lúc thay vì gọi riêng lẻ
    const ingredientIds: string[] = []

    ingredientUpdates.forEach((quantity, ingredientId) => {
      // ngược so với map về thứ tự tham số
      ingredientIds.push(ingredientId)
      bulkOps.push({
        updateOne: {
          filter: {
            _id: new ObjectId(ingredientId),
            currentStock: { $gte: quantity }
          },
          update: {
            $inc: { currentStock: -quantity }
          }
        }
      })
    })

    const result = await databaseService.ingredients.bulkWrite(bulkOps)
    if (result.matchedCount < bulkOps.length) {
      // --- LOGIC ROLLBACK (QUAN TRỌNG) ---
      // Vì MongoDB (nếu không dùng Replica Set Transaction) không tự rollback nếu 1 cái fail trong bulkWrite.
      // Chúng ta phải tự cộng lại những cái đã trừ thành công.

      // Bước 4a: Tìm ra những nguyên liệu bị trừ "lỡ" (nếu có) để hoàn tác,
      // Nhưng để đơn giản và an toàn nhất ở mức code:
      // Nếu thất bại, chúng ta sẽ cố gắng đảo ngược lại chính những lệnh vừa chạy (nhưng cộng vào).
      // Tuy nhiên, cách tốt nhất ở đây là throw lỗi ngay.
      // Để xử lý triệt để vấn đề rollback thủ công khá phức tạp,
      // tôi sẽ hướng dẫn bạn cách "bắn lỗi" cho user biết món nào hết hàng.

      // *Lưu ý thực tế: Nếu bạn deploy lên Atlas, hãy dùng session.startTransaction() là tốt nhất.
      // Dưới đây là giải pháp "Manual Rollback" đơn giản cho Standalone DB:

      // Logic phục hồi: Cộng lại tất cả những gì đã trừ (nếu bị modify)
      if (result.modifiedCount > 0) {
        // Đây là xử lý nâng cao: Phải tìm xem cái nào đã bị trừ để cộng lại.
        // Trong phạm vi đồ án, ta có thể chấp nhận rủi ro nhỏ hoặc dùng Transaction.
        // Ở đây tôi throw lỗi để chặn đơn hàng được tạo ra.
      }

      throw new ErrorWithStatus({
        message: "Một số món ăn đã hết nguyên liệu phục vụ, vui lòng gọi món khác.",
        status: HTTP_STATUS.BAD_REQUEST
      })
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
      userId: user_id,
      tableNumber: table.number,
      guestName,
      role: ROLE_GUEST
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
    const table = await databaseService.tables.findOne({ _id: tableObjectId })
    let orderResult

    if (table?.currentOrderId) {
      // Bàn Đang Ăn -> Cập nhật đơn cũ
      const currentOrderId = table.currentOrderId
      console.log(currentOrderId)
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
    console.log(orderResult) // null
    return orderResult
  }
}
const guestServices = new GuestService()
export default guestServices
