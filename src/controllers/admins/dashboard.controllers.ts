import { Request, Response } from "express"
import dashboardService from "../../services/dashboard.services"

export const getDashboardStatsController = async (req: Request, res: Response) => {
  // Lấy type từ query, mặc định là 'day'
  const type = (req.query.type as "day" | "week" | "month") || "day"

  const data = await dashboardService.getDashboardStats(type)

  return res.status(200).json({
    message: "Success",
    data: data
  })
}
