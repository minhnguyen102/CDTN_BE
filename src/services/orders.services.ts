import { ObjectId } from "mongodb"
import { OrderItemStatus } from "../constants/enums"
import databaseService from "./database.servies"
import { getIO } from "../utils/socket"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { update } from "lodash"

class OrderServices {
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

  async updateItemStatus({ orderId, itemId, status }: { orderId: string; itemId: string; status: OrderItemStatus }) {
    const result = await databaseService.orders.findOneAndUpdate(
      {
        _id: new ObjectId(orderId),
        "items._id": new ObjectId(itemId)
      },
      {
        $set: {
          "items.$.status": status, //Dấu $ đánh dấu vị trị tìm được
          "items.$.updatedAt": new Date()
        }
      },
      {
        returnDocument: "after"
      }
    )

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

    const socketPayload = {
      orderId,
      itemId,
      status,
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
    return updateOrder
  }
}
const orderServices = new OrderServices()
export default orderServices
