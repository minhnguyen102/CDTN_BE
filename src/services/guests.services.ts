import databaseService from "../services/database.servies"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { signToken } from "../utils/jwt"
import { DishCategoryStatus, DishStatus, ROLE_GUEST, TableStatus, TokenType } from "../constants/enums"

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
}
const guestServices = new GuestService()
export default guestServices
