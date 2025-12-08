import databaseService from "./database.servies"

class OrderServices {
  async getAllOrders({
    limit,
    page,
    status,
    search
  }: {
    limit: number
    page: number
    status?: string
    search?: string
  }) {
    const match: any = {}

    // Lọc theo trạng thái (Nếu có truyền lên)
    // Ví dụ: ?status=Pending -> Chỉ lấy đơn đang chờ
    if (status) {
      match.status = status
    }

    // Phân trang (Pagination)
    const skip = (page - 1) * limit

    // Query Database
    const [orders, total] = await Promise.all([
      databaseService.orders.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
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
