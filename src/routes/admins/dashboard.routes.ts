import { Router } from "express"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { getDashboardStatsController } from "../../controllers/admins/dashboard.controllers"

const dashboardRoutes = Router()

/**
 * Path: /dashboard/stats
 * Method: GET
 * Query Params: ?type=day | week | month
 * Description: Lấy số liệu thống kê doanh thu, đơn hàng, món ăn...
 * Access: Admin Only
 */
dashboardRoutes.get(
  "/stats",
  accessTokenValidation,
  verifiedUserValidation,
  wrapHandlerFunction(getDashboardStatsController)
)

export default dashboardRoutes
