import { OrderItemStatus, PaymentStatus, TableStatus } from "../constants/enums"
import databaseService from "./database.servies"

class DashboardService {
  // Hàm tính % tăng trưởng
  private calculateTrend(current: number, previous: number) {
    if (previous === 0) return { value: current === 0 ? 0 : 100, type: "neutral" }
    const percent = ((current - previous) / previous) * 100
    return {
      value: Math.abs(Math.round(percent * 10) / 10),
      type: percent > 0 ? "up" : percent < 0 ? "down" : "neutral"
    }
  }

  // Hàm lấy khung thời gian
  private getTimeRange(params: {
    type?: "day" | "week" | "month" | "year" | "custom"
    specificDate?: string // Ngày cụ thể để tính toán (YYYY-MM-DD)
    startDate?: string
    endDate?: string
    startHour?: number
    endHour?: number
    startDay?: number
    endDay?: number
    startDayOfMonth?: number
    endDayOfMonth?: number
    startMonth?: number
    endMonth?: number
  }) {
    const { type = "day", specificDate } = params
    const now = specificDate ? new Date(specificDate) : new Date()
    let start: Date, end: Date, prevStart: Date, prevEnd: Date
    let labelCompare = ""
    let chartFormat = ""

    if (type === "custom") {
      // Custom date range
      start = new Date(params.startDate!)
      start.setHours(0, 0, 0, 0)
      end = new Date(params.endDate!)
      end.setHours(23, 59, 59, 999)

      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - diffDays)
      prevEnd = new Date(start)
      prevEnd.setSeconds(-1)

      labelCompare = "so với kỳ trước"
      chartFormat = diffDays <= 1 ? "%H" : "%Y-%m-%d"
    } else if (type === "year") {
      // Trong năm - chọn tháng (có thể chọn năm cụ thể qua specificDate)
      const startM = params.startMonth || 1
      const endM = params.endMonth || 12

      start = new Date(now.getFullYear(), startM - 1, 1, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), endM, 0, 23, 59, 59, 999)

      prevStart = new Date(now.getFullYear() - 1, startM - 1, 1, 0, 0, 0, 0)
      prevEnd = new Date(now.getFullYear() - 1, endM, 0, 23, 59, 59, 999)

      labelCompare = "so với năm trước"
      chartFormat = "%Y-%m"
    } else if (type === "month") {
      // Trong tháng - chọn ngày (có thể chọn tháng/năm cụ thể qua specificDate)
      const startD = params.startDayOfMonth || 1
      const endD = params.endDayOfMonth || new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

      start = new Date(now.getFullYear(), now.getMonth(), startD, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth(), endD, 23, 59, 59, 999)

      prevStart = new Date(start)
      prevStart.setMonth(prevStart.getMonth() - 1)
      prevEnd = new Date(end)
      prevEnd.setMonth(prevEnd.getMonth() - 1)

      labelCompare = "so với tháng trước"
      chartFormat = "%Y-%m-%d"
    } else if (type === "week") {
      // Trong tuần - chọn ngày trong tuần (có thể chọn tuần cụ thể qua specificDate)
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const weekStart = new Date(now)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)

      const startD = params.startDay !== undefined ? params.startDay : 1 // Monday
      const endD = params.endDay !== undefined ? params.endDay : 0 // Sunday

      start = new Date(weekStart)
      start.setDate(start.getDate() + (startD === 0 ? 6 : startD - 1))

      end = new Date(weekStart)
      end.setDate(end.getDate() + (endD === 0 ? 6 : endD - 1))
      end.setHours(23, 59, 59, 999)

      prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 7)
      prevEnd = new Date(end)
      prevEnd.setDate(prevEnd.getDate() - 7)

      labelCompare = "so với tuần trước"
      chartFormat = "%Y-%m-%d"
    } else {
      // day - chọn giờ trong ngày (có thể chọn ngày cụ thể qua specificDate)
      const startH = params.startHour !== undefined ? params.startHour : 0
      const endH = params.endHour !== undefined ? params.endHour : 23

      start = new Date(now)
      start.setHours(startH, 0, 0, 0)

      end = new Date(now)
      end.setHours(endH, 59, 59, 999)

      prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 1)
      prevEnd = new Date(end)
      prevEnd.setDate(prevEnd.getDate() - 1)

      labelCompare = "so với hôm qua"
      chartFormat = "%H"
    }

    return { start, end, prevStart, prevEnd, labelCompare, chartFormat }
  }

  // Hàm hiển thị trạng thái đơn hàng thông minh (cho Recent Orders)
  private deriveOrderStatus(order: any) {
    if (order.paymentStatus === PaymentStatus.PAID) return "completed" // Đã thanh toán -> Hoàn thành

    // Nếu chưa thanh toán, check trạng thái món ăn
    const items = order.items || []
    if (items.some((i: any) => i.status === OrderItemStatus.Cooking)) return "cooking"
    if (items.some((i: any) => i.status === OrderItemStatus.Served)) return "serving"
    return "pending"
  }

  async getDashboardStats(type: "day" | "week" | "month" = "day") {
    const { start, end, prevStart, prevEnd, labelCompare, chartFormat } = this.getTimeRange({ type })

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
              _id: { $dateToString: { format: chartFormat, date: "$createdAt", timezone: "+07:00" } },
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
      aggregateStats(start, end), // Số liệu hiện tại
      aggregateStats(prevStart, prevEnd), // Số liệu quá khứ
      getChartData(), // Dữ liệu biểu đồ
      getTopProducts(), // Top món bán chạy

      // Đơn hàng gần đây (Lấy cả unpaid để theo dõi vận hành)
      databaseService.orders.find({}).sort({ createdAt: -1 }).limit(5).toArray(),

      // Trạng thái bàn
      databaseService.tables.find({}).toArray()
    ])

    // --- XỬ LÝ LOGIC HIỂN THỊ ---

    // Calculate Trends
    const revenueTrend = this.calculateTrend(curr.revenue, prev.revenue)
    const orderTrend = this.calculateTrend(curr.orders, prev.orders)
    const dishTrend = this.calculateTrend(curr.dishes, prev.dishes)

    // Table Stats
    const totalTables = tables.length
    // Bàn active là bàn không AVAILABLE (có thể là OCCUPIED hoặc BOOKED)
    const activeTables = tables.filter((t) => t.status !== TableStatus.AVAILABLE).length
    const capacityPercent = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0

    // Chart Filling (Điền số 0 vào giờ trống)
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
        price: p.revenue / p.sales,
        sales: p.sales,
        revenue: p.revenue
      })),
      recent_orders: recentOrdersRaw.map((o) => ({
        id: o._id,
        table: `Bàn ${o.tableNumber}`,
        guestName: o.guestName,
        amount: o.totalAmount,
        status: this.deriveOrderStatus(o),
        type: "Dùng tại bàn",
        time: o.createdAt.getTime()
      }))
    }
  }

  /**
   * 1️⃣ Doanh thu theo phương thức thanh toán
   * Biểu đồ: Pie chart / Donut chart
   * Mục đích: Phân tích hành vi thanh toán khách hàng
   */
  async getRevenueByPaymentMethod(type: "day" | "week" | "month" | "year" = "day", params?: any) {
    const { start, end } = this.getTimeRange(params || { type })

    // 🔍 DEBUG: First check ALL payment methods in database (no time filter)
    const allPaymentMethods = await databaseService.orders
      .aggregate([
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 }
          }
        }
      ])
      .toArray()

    console.log("🔍 ALL Payment Methods in DB (no time filter):", JSON.stringify(allPaymentMethods, null, 2))

    // 🔍 DEBUG: Log query parameters
    console.log("🔍 Query Parameters:", {
      type,
      params,
      start: start.toISOString(),
      end: end.toISOString()
    })

    const result = await databaseService.orders
      .aggregate([
        {
          $match: {
            // ⚠️ TEMPORARILY REMOVED PaymentStatus filter to debug
            // paymentStatus: PaymentStatus.PAID,
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: "$paymentMethod",
            totalRevenue: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ])
      .toArray()

    // 🔍 DEBUG: Log raw data to see what's in database
    console.log("🔍 Revenue by Payment Method - Raw Data:", JSON.stringify(result, null, 2))

    // Tính tổng để có %
    const totalRevenue = result.reduce((sum, item) => sum + item.totalRevenue, 0)

    // Map payment method to Vietnamese labels
    const paymentMethodLabels: Record<string, string> = {
      Cash: "Tiền mặt",
      Bank: "Chuyển khoản"
    }

    return {
      data: result.map((item) => ({
        method: paymentMethodLabels[item._id] || item._id,
        revenue: item.totalRevenue,
        orderCount: item.orderCount,
        percentage: totalRevenue > 0 ? Math.round((item.totalRevenue / totalRevenue) * 100 * 10) / 10 : 0
      })),
      total: totalRevenue
    }
  }

  /**
   * 2️⃣ Món bán chậm
   * Biểu đồ: Bar chart
   * Mục đích: Loại bỏ hoặc cải tiến món
   */
  async getSlowMovingDishes(type: "day" | "week" | "month" | "year" = "day", limit: number = 10, params?: any) {
    const { start, end } = this.getTimeRange(params || { type })

    // Lấy tất cả món ăn active
    const allDishes = await databaseService.dishes
      .find({ deleted: false, status: "available" as any })
      .project({ _id: 1, name: 1, price: 1 })
      .toArray()

    // Lấy dữ liệu bán hàng
    const salesData = await databaseService.orders
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
            _id: "$items.dishId",
            totalSales: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.dishPrice", "$items.quantity"] } }
          }
        }
      ])
      .toArray()

    // Map sales data
    const salesMap = new Map(salesData.map((item) => [item._id.toString(), item]))

    // Kết hợp dữ liệu
    const dishesWithSales = allDishes.map((dish) => {
      const sales = salesMap.get(dish._id.toString())
      return {
        id: dish._id,
        name: dish.name,
        price: dish.price,
        sales: sales?.totalSales || 0,
        revenue: sales?.revenue || 0
      }
    })

    // Sort theo số lượng bán tăng dần (món bán ít nhất)
    dishesWithSales.sort((a, b) => a.sales - b.sales)

    return {
      data: dishesWithSales.slice(0, limit)
    }
  }

  /**
   * 3️⃣ Doanh thu theo nhóm món
   * Biểu đồ: Pie chart / Stacked bar
   * Mục đích: Biết nhóm món nào sinh lời cao
   */
  async getRevenueByDishCategory(type: "day" | "week" | "month" | "year" = "day", params?: any) {
    const { start, end } = this.getTimeRange(params || { type })

    const result = await databaseService.orders
      .aggregate([
        {
          $match: {
            paymentStatus: PaymentStatus.PAID,
            createdAt: { $gte: start, $lte: end }
          }
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "dishes",
            localField: "items.dishId",
            foreignField: "_id",
            as: "dishInfo"
          }
        },
        { $unwind: "$dishInfo" },
        {
          $lookup: {
            from: "dish_categories",
            localField: "dishInfo.categoryId",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        { $unwind: "$categoryInfo" },
        {
          $group: {
            _id: "$categoryInfo._id",
            categoryName: { $first: "$categoryInfo.name" },
            revenue: { $sum: { $multiply: ["$items.dishPrice", "$items.quantity"] } },
            quantity: { $sum: "$items.quantity" },
            orderCount: { $addToSet: "$_id" } // Đếm số đơn unique
          }
        },
        {
          $project: {
            categoryName: 1,
            revenue: 1,
            quantity: 1,
            orderCount: { $size: "$orderCount" }
          }
        },
        { $sort: { revenue: -1 } }
      ])
      .toArray()

    const totalRevenue = result.reduce((sum, item) => sum + item.revenue, 0)

    return {
      data: result.map((item) => ({
        categoryId: item._id,
        categoryName: item.categoryName,
        revenue: item.revenue,
        quantity: item.quantity,
        orderCount: item.orderCount,
        percentage: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100 * 10) / 10 : 0
      })),
      total: totalRevenue
    }
  }

  /**
   * 4️⃣ Tần suất sử dụng bàn
   * Biểu đồ: Bar chart / Heatmap
   * Mục đích: Bố trí lại sơ đồ bàn hợp lý
   */
  async getTableUsageFrequency(type: "day" | "week" | "month" | "year" = "day", params?: any) {
    const { start, end } = this.getTimeRange(params || { type })

    const result = await databaseService.orders
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: "$tableNumber",
            usageCount: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", PaymentStatus.PAID] }, "$totalAmount", 0]
              }
            },
            avgOrderValue: {
              $avg: {
                $cond: [{ $eq: ["$paymentStatus", PaymentStatus.PAID] }, "$totalAmount", null]
              }
            }
          }
        },
        { $sort: { usageCount: -1 } }
      ])
      .toArray()

    // Lấy thông tin bàn từ collection tables
    const tables = await databaseService.tables.find({}).toArray()
    const tableMap = new Map(tables.map((t) => [t.number, t]))

    return {
      data: result.map((item) => {
        const tableInfo = tableMap.get(item._id)
        return {
          tableNumber: item._id,
          capacity: tableInfo?.capacity || 0,
          usageCount: item.usageCount,
          totalRevenue: item.totalRevenue,
          avgOrderValue: Math.round(item.avgOrderValue || 0)
        }
      })
    }
  }

  /**
   * 5️⃣ Lượng khách theo khung giờ
   * Biểu đồ: Line chart / Column chart
   * Mục đích: Tối ưu phục vụ & nhân lực
   */
  async getCustomersByTimeSlot(type: "day" | "week" | "month" | "year" = "day", params?: any) {
    const { start, end } = this.getTimeRange(params || { type })

    const result = await databaseService.orders
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $project: {
            hour: { $hour: { date: "$createdAt", timezone: "+07:00" } },
            totalAmount: 1,
            paymentStatus: 1
          }
        },
        {
          $group: {
            _id: "$hour",
            orderCount: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", PaymentStatus.PAID] }, "$totalAmount", 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray()

    // Tạo array 24 giờ với giá trị mặc định
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const found = result.find((item) => item._id === hour)
      return {
        hour: `${hour.toString().padStart(2, "0")}:00`,
        orderCount: found?.orderCount || 0,
        revenue: found?.revenue || 0
      }
    })

    // Tìm giờ cao điểm và thấp điểm
    const maxOrders = Math.max(...hourlyData.map((h) => h.orderCount))
    const minOrders = Math.min(...hourlyData.filter((h) => h.orderCount > 0).map((h) => h.orderCount))

    const peakHours = hourlyData.filter((h) => h.orderCount === maxOrders).map((h) => h.hour)
    const lowHours = hourlyData.filter((h) => h.orderCount === minOrders && h.orderCount > 0).map((h) => h.hour)

    return {
      data: hourlyData,
      insights: {
        peakHours,
        lowHours,
        totalOrders: hourlyData.reduce((sum, h) => sum + h.orderCount, 0)
      }
    }
  }

  /**
   * 6️⃣ Thời gian phục vụ trung bình
   * Biểu đồ: Line chart
   * Mục đích: Cải thiện tốc độ phục vụ
   */
  async getAverageServiceTime(type: "day" | "week" | "month" | "year" = "day", params?: any) {
    const { start, end } = this.getTimeRange(params || { type })

    const result = await databaseService.orders
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        { $unwind: "$items" },
        {
          $project: {
            dishName: "$items.dishName",
            orderTime: "$items.createdAt",
            processingHistory: "$items.processingHistory",
            // Tìm thời điểm món được serve
            servedTime: {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: "$items.processingHistory",
                        as: "history",
                        cond: { $eq: ["$$history.status", OrderItemStatus.Served] }
                      }
                    },
                    as: "served",
                    in: "$$served.updatedAt"
                  }
                },
                0
              ]
            }
          }
        },
        {
          $match: {
            servedTime: { $exists: true, $ne: null }
          }
        },
        {
          $project: {
            dishName: 1,
            serviceTimeMs: { $subtract: ["$servedTime", "$orderTime"] }
          }
        },
        {
          $group: {
            _id: null,
            avgServiceTimeMs: { $avg: "$serviceTimeMs" },
            minServiceTimeMs: { $min: "$serviceTimeMs" },
            maxServiceTimeMs: { $max: "$serviceTimeMs" },
            totalServedItems: { $sum: 1 }
          }
        }
      ])
      .toArray()

    if (result.length === 0) {
      return {
        avgServiceTime: 0,
        minServiceTime: 0,
        maxServiceTime: 0,
        totalServedItems: 0,
        message: "Chưa có dữ liệu món đã phục vụ trong khoảng thời gian này"
      }
    }

    const data = result[0]

    // Convert từ milliseconds sang phút
    const msToMinutes = (ms: number) => Math.round(ms / 1000 / 60)

    return {
      avgServiceTime: msToMinutes(data.avgServiceTimeMs),
      minServiceTime: msToMinutes(data.minServiceTimeMs),
      maxServiceTime: msToMinutes(data.maxServiceTimeMs),
      totalServedItems: data.totalServedItems,
      unit: "minutes"
    }
  }
}

export default new DashboardService()
