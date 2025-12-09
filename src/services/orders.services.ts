import databaseService from "./database.servies"

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
    console.log(queryPipeline)
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
    console.log(queryPipeline)
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
}
const orderServices = new OrderServices()
export default orderServices
