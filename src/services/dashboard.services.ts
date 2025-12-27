import { OrderItemStatus, PaymentStatus, TableStatus } from "../constants/enums"
import databaseService from "./database.servies"

class DashboardService {
  // 1. Hàm tính % tăng trưởng (giữ nguyên logic cũ)
  private calculateTrend(current: number, previous: number) {
    if (previous === 0) return { value: current === 0 ? 0 : 100, type: "neutral" }
    const percent = ((current - previous) / previous) * 100
    return {
      value: Math.abs(Math.round(percent * 10) / 10),
      type: percent > 0 ? "up" : percent < 0 ? "down" : "neutral"
    }
  }

  // 2. Hàm lấy khung thời gian (giữ nguyên logic cũ)
  private getTimeRange(type: "day" | "week" | "month") {
    const now = new Date()
    let start, end, prevStart, prevEnd
    let labelCompare = ""
    let chartFormat = ""

    if (type === "week") {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      start = new Date(now.setDate(diff))
      start.setHours(0, 0, 0, 0)
      end = new Date()

      prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 7)
      prevEnd = new Date(prevStart)
      prevEnd.setDate(prevEnd.getDate() + 6)
      prevEnd.setHours(23, 59, 59, 999)

      labelCompare = "so với tuần trước"
      chartFormat = "%Y-%m-%d"
    } else if (type === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date()

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      labelCompare = "so với tháng trước"
      chartFormat = "%Y-%m-%d"
    } else {
      start = new Date()
      start.setHours(0, 0, 0, 0)
      end = new Date()

      prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 1)
      prevEnd = new Date(start)
      prevEnd.setSeconds(-1)

      labelCompare = "so với hôm qua"
      chartFormat = "%H"
    }
    return { start, end, prevStart, prevEnd, labelCompare, chartFormat }
  }

  // 3. Hàm hiển thị trạng thái đơn hàng thông minh (cho Recent Orders)
  private deriveOrderStatus(order: any) {
    if (order.paymentStatus === PaymentStatus.PAID) return "completed" // Đã thanh toán -> Hoàn thành

    // Nếu chưa thanh toán, check trạng thái món ăn
    const items = order.items || []
    if (items.some((i: any) => i.status === OrderItemStatus.Cooking)) return "cooking"
    if (items.some((i: any) => i.status === OrderItemStatus.Served)) return "serving"
    return "pending"
  }

  async getDashboardStats(type: "day" | "week" | "month" = "day") {
    const { start, end, prevStart, prevEnd, labelCompare, chartFormat } = this.getTimeRange(type)

    // --- QUERY 1: Lấy số liệu Thống kê (Hiện tại & Quá khứ) ---
    // Chỉ tính các đơn ĐÃ THANH TOÁN (PAID) cho doanh thu và số lượng
    const aggregateStats = async (startDate: Date, endDate: Date) => {
      const result = await databaseService.orders
        .aggregate([
          {
            $match: {
              paymentStatus: PaymentStatus.PAID, // Quan trọng: Chỉ tính đơn đã trả tiền
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $facet: {
              // Nhóm 1: Tính tổng tiền và tổng đơn
              general: [
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: "$totalAmount" }, // Schema: totalAmount nằm ở root
                    orders: { $sum: 1 }
                  }
                }
              ],
              // Nhóm 2: Tính tổng món (Phải unwind items)
              dishes: [
                { $unwind: "$items" },
                {
                  $group: {
                    _id: null,
                    totalDishes: { $sum: "$items.quantity" }
                  }
                }
              ]
            }
          }
        ])
        .toArray()

      const general = result[0].general[0] || { revenue: 0, orders: 0 }
      const dishes = result[0].dishes[0] || { totalDishes: 0 }

      return { ...general, dishes: dishes.totalDishes }
    }

    // --- QUERY 2: Lấy dữ liệu Chart ---
    const getChartData = async () => {
      return await databaseService.orders
        .aggregate([
          {
            $match: {
              paymentStatus: PaymentStatus.PAID,
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: chartFormat, date: "$createdAt" } }, // timezone: "+07:00" nếu cần
              revenue: { $sum: "$totalAmount" }
            }
          },
          { $sort: { _id: 1 } }
        ])
        .toArray()
    }

    // --- QUERY 3: Top Products (Unwind Items) ---
    const getTopProducts = async () => {
      return await databaseService.orders
        .aggregate([
          {
            $match: {
              paymentStatus: PaymentStatus.PAID,
              createdAt: { $gte: start, $lte: end }
            }
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.dishId", // Group theo dishId trong mảng items
              name: { $first: "$items.dishName" }, // Schema: dishName
              // price: { $first: "$items.dishPrice" },
              sales: { $sum: "$items.quantity" },
              revenue: { $sum: { $multiply: ["$items.dishPrice", "$items.quantity"] } }
            }
          },
          { $sort: { sales: -1 } },
          { $limit: 5 }
        ])
        .toArray()
    }

    // --- EXECUTE ALL PROMISES ---
    const [curr, prev, chartRawData, topProducts, recentOrdersRaw, tables] = await Promise.all([
      aggregateStats(start, end), // 1. Số liệu hiện tại
      aggregateStats(prevStart, prevEnd), // 2. Số liệu quá khứ
      getChartData(), // 3. Dữ liệu biểu đồ
      getTopProducts(), // 4. Top món bán chạy

      // 5. Đơn hàng gần đây (Lấy cả unpaid để theo dõi vận hành)
      databaseService.orders.find({}).sort({ createdAt: -1 }).limit(5).toArray(),

      // 6. Trạng thái bàn
      databaseService.tables.find({}).toArray()
    ])

    // --- XỬ LÝ LOGIC HIỂN THỊ ---

    // 1. Calculate Trends
    const revenueTrend = this.calculateTrend(curr.revenue, prev.revenue)
    const orderTrend = this.calculateTrend(curr.orders, prev.orders)
    const dishTrend = this.calculateTrend(curr.dishes, prev.dishes)

    // 2. Table Stats
    const totalTables = tables.length
    // Bàn active là bàn không AVAILABLE (có thể là OCCUPIED hoặc BOOKED)
    const activeTables = tables.filter((t) => t.status !== TableStatus.AVAILABLE).length
    const capacityPercent = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0

    // 3. Chart Filling (Điền số 0 vào giờ trống)
    const categories: string[] = []
    const seriesData: number[] = []

    if (type === "day") {
      for (let i = 0; i < 24; i++) {
        const hourKey = i.toString().padStart(2, "0")
        categories.push(`${hourKey}:00`)
        const found = chartRawData.find((item) => item._id === hourKey)
        seriesData.push(found ? found.revenue : 0)
      }
    } else if (type === "week") {
      const tempDate = new Date(start)
      const days = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"]
      while (tempDate <= end && tempDate <= new Date()) {
        const dateKey = tempDate.toISOString().split("T")[0]
        categories.push(days[tempDate.getDay()])
        const found = chartRawData.find((item) => item._id === dateKey)
        seriesData.push(found ? found.revenue : 0)
        tempDate.setDate(tempDate.getDate() + 1)
      }
    } else {
      // Month
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        const dayKey = i.toString().padStart(2, "0")
        const fullDateKey = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, "0")}-${dayKey}`
        if (new Date(fullDateKey) > new Date()) break

        categories.push(dayKey)
        const found = chartRawData.find((item) => item._id === fullDateKey)
        seriesData.push(found ? found.revenue : 0)
      }
    }

    // --- FINAL RESPONSE FORMAT ---
    return {
      stats: [
        {
          key: "revenue",
          label: "Tổng doanh thu",
          value: curr.revenue,
          trend_value: revenueTrend.value,
          trend_type: revenueTrend.type,
          trend_label: labelCompare
        },
        {
          key: "orders",
          label: "Đơn hàng",
          value: curr.orders,
          trend_value: orderTrend.value,
          trend_type: orderTrend.type,
          trend_label: labelCompare
        },
        {
          key: "dishes",
          label: "Món đã bán",
          value: curr.dishes,
          trend_value: dishTrend.value,
          trend_type: dishTrend.type,
          trend_label: labelCompare
        },
        {
          key: "tables",
          label: "Bàn đang phục vụ",
          value: `${activeTables}/${totalTables}`,
          trend_value: capacityPercent,
          trend_type: "neutral",
          trend_label: "công suất nhà hàng"
        }
      ],
      chart: {
        categories,
        series: [{ name: "Doanh thu", data: seriesData }]
      },
      top_products: topProducts.map((p) => ({
        id: p._id,
        name: p.name,
        price: p.revenue / p.sales, // Tính lại giá trung bình nếu cần
        sales: p.sales,
        revenue: p.revenue
      })),
      recent_orders: recentOrdersRaw.map((o) => ({
        id: o._id,
        table: `Bàn ${o.tableNumber}`, // Schema: tableNumber
        amount: o.totalAmount, // Schema: totalAmount
        status: this.deriveOrderStatus(o), // "completed" | "cooking" | "pending"
        type: "Dùng tại bàn", // Có thể map dựa vào field khác nếu có
        time: o.createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      }))
    }
  }
}

export default new DashboardService()
