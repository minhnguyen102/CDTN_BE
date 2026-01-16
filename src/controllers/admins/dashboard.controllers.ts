import { Request, Response } from "express"
import dashboardService from "../../services/dashboard.services"

/**
 * Unified Analytics Controller - Returns all analytics data in one call
 */
export const getAllAnalyticsController = async (req: Request, res: Response) => {
  const type = (req.query.type as "day" | "week" | "month" | "year") || "day"
  const limit = parseInt(req.query.limit as string) || 10

  // ✨ Extract ALL date range parameters from query string
  const params: any = { type }
  if (req.query.specificDate) params.specificDate = req.query.specificDate as string
  if (req.query.startDate) params.startDate = req.query.startDate as string
  if (req.query.endDate) params.endDate = req.query.endDate as string
  if (req.query.startHour) params.startHour = parseInt(req.query.startHour as string)
  if (req.query.endHour) params.endHour = parseInt(req.query.endHour as string)
  if (req.query.startDay) params.startDay = parseInt(req.query.startDay as string)
  if (req.query.endDay) params.endDay = parseInt(req.query.endDay as string)
  if (req.query.startDayOfMonth) params.startDayOfMonth = parseInt(req.query.startDayOfMonth as string)
  if (req.query.endDayOfMonth) params.endDayOfMonth = parseInt(req.query.endDayOfMonth as string)
  if (req.query.startMonth) params.startMonth = parseInt(req.query.startMonth as string)
  if (req.query.endMonth) params.endMonth = parseInt(req.query.endMonth as string)

  console.log("🔍 getAllAnalytics - Received params:", JSON.stringify(params, null, 2))

  // Fetch all analytics in parallel for better performance
  const [
    revenueByPaymentMethod,
    slowMovingDishes,
    revenueByDishCategory,
    tableUsageFrequency,
    customersByTimeSlot,
    averageServiceTime,
  ] = await Promise.all([
    dashboardService.getRevenueByPaymentMethod(params.type, params),
    dashboardService.getSlowMovingDishes(params.type, limit, params),
    dashboardService.getRevenueByDishCategory(params.type, params),
    dashboardService.getTableUsageFrequency(params.type, params),
    dashboardService.getCustomersByTimeSlot(params.type, params),
    dashboardService.getAverageServiceTime(params.type, params),
  ])

  return res.status(200).json({
    message: "Lấy tất cả dữ liệu analytics thành công",
    data: {
      revenueByPaymentMethod,
      slowMovingDishes,
      revenueByDishCategory,
      tableUsageFrequency,
      customersByTimeSlot,
      averageServiceTime,
    },
  })
}

export const getDashboardStatsController = async (req: Request, res: Response) => {
  const type = (req.query.type as "day" | "week" | "month") || "day"
  const data = await dashboardService.getDashboardStats(type)

  return res.status(200).json({
    message: "Success",
    data: data
  })
}

export const getRevenueByPaymentMethodController = async (req: Request, res: Response) => {
  const type = (req.query.type as "day" | "week" | "month") || "day"
  const data = await dashboardService.getRevenueByPaymentMethod(type)

  return res.status(200).json({
    message: "Lấy dữ liệu doanh thu theo phương thức thanh toán thành công",
    data
  })
}

export const getSlowMovingDishesController = async (req: Request, res: Response) => {
  const type = (req.query.type as "day" | "week" | "month") || "day"
  const limit = parseInt(req.query.limit as string) || 10
  const data = await dashboardService.getSlowMovingDishes(type, limit)

  return res.status(200).json({
    message: "Lấy dữ liệu món bán chậm thành công",
    data
  })
}

export const getRevenueByDishCategoryController = async (req: Request, res: Response) => {
  const type = (req.query.type as "day" | "week" | "month") || "day"
  const data = await dashboardService.getRevenueByDishCategory(type)

  return res.status(200).json({
    message: "Lấy dữ liệu doanh thu theo nhóm món thành công",
    data
  })
}

export const getTableUsageFrequencyController = async (req: Request, res: Response) => {
  const type = (req.query.type as "day" | "week" | "month") || "day"
  const data = await dashboardService.getTableUsageFrequency(type)

  return res.status(200).json({
    message: "Lấy dữ liệu tần suất sử dụng bàn thành công",
    data
  })
}

export const getCustomersByTimeSlotController = async (req: Request, res: Response) => {
  const type = (req.query.type as "day" | "week" | "month") || "day"
  const data = await dashboardService.getCustomersByTimeSlot(type)

  return res.status(200).json({
    message: "Lấy dữ liệu lượng khách theo khung giờ thành công",
    data
  })
}

export const getAverageServiceTimeController = async (req: Request, res: Response) => {
  const type = (req.query.type as "day" | "week" | "month") || "day"
  const data = await dashboardService.getAverageServiceTime(type)

  return res.status(200).json({
    message: "Lấy dữ liệu thời gian phục vụ trung bình thành công",
    data
  })
}
