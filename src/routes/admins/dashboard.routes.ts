import { Router } from "express"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import {
  getDashboardStatsController,
  getAllAnalyticsController,
  getRevenueByPaymentMethodController,
  getSlowMovingDishesController,
  getRevenueByDishCategoryController,
  getTableUsageFrequencyController,
  getCustomersByTimeSlotController,
  getAverageServiceTimeController
} from "../../controllers/admins/dashboard.controllers"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import { dashboardQueryValidation } from "../../middlewares/admins/dashboard.middlewares"

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
  checkPermission("view_dashboard"),
  wrapHandlerFunction(getDashboardStatsController)
)

/**
 * Path: /dashboard/analytics
 * Method: GET
 * Query Params: ?type=day | week | month &limit=10
 * Description: Lấy TẤT CẢ dữ liệu analytics trong 1 call
 * Access: Admin Only
 */
dashboardRoutes.get(
  "/analytics",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_dashboard"),
  dashboardQueryValidation,
  wrapHandlerFunction(getAllAnalyticsController)
)

dashboardRoutes.get(
  "/revenue-by-payment-method",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_dashboard"),
  dashboardQueryValidation,
  wrapHandlerFunction(getRevenueByPaymentMethodController)
)

dashboardRoutes.get(
  "/slow-moving-dishes",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_dashboard"),
  dashboardQueryValidation,
  wrapHandlerFunction(getSlowMovingDishesController)
)

dashboardRoutes.get(
  "/revenue-by-dish-category",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_dashboard"),
  dashboardQueryValidation,
  wrapHandlerFunction(getRevenueByDishCategoryController)
)

dashboardRoutes.get(
  "/table-usage-frequency",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_dashboard"),
  dashboardQueryValidation,
  wrapHandlerFunction(getTableUsageFrequencyController)
)

dashboardRoutes.get(
  "/customers-by-time-slot",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_dashboard"),
  dashboardQueryValidation,
  wrapHandlerFunction(getCustomersByTimeSlotController)
)

dashboardRoutes.get(
  "/average-service-time",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_dashboard"),
  dashboardQueryValidation,
  wrapHandlerFunction(getAverageServiceTimeController)
)

export default dashboardRoutes
