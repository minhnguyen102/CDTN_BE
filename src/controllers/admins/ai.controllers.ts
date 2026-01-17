import { Request, Response } from "express";
import aiService from "../../services/ai.services";
import dashboardService from "../../services/dashboard.services";
import databaseService from "../../services/database.servies";
import { PaymentStatus } from "../../constants/enums";

export const analyzeRestaurantController = async (req: Request, res: Response) => {
  try {
    const params = extractDateParams(req.query);

    // Fetch all analytics data
    const [
      revenueByPaymentMethod,
      slowMovingDishes,
      revenueByDishCategory,
      tableUsageFrequency,
      customersByTimeSlot,
      averageServiceTime,
      additionalData
    ] = await Promise.all([
      dashboardService.getRevenueByPaymentMethod(params.type, params),
      dashboardService.getSlowMovingDishes(params.type, 10, params),
      dashboardService.getRevenueByDishCategory(params.type, params),
      dashboardService.getTableUsageFrequency(params.type, params),
      dashboardService.getCustomersByTimeSlot(params.type, params),
      dashboardService.getAverageServiceTime(params.type, params),
      fetchAdditionalData(params)
    ]);

    // Combine all data
    const combinedData = {
      revenueByPaymentMethod,
      slowMovingDishes,
      revenueByDishCategory,
      tableUsageFrequency,
      customersByTimeSlot,
      averageServiceTime,
      ...additionalData
    };

    // Call AI service
    const analysis = await aiService.analyzeRestaurantData(combinedData);

    res.json({
      message: "Phân tích thành công",
      data: analysis
    });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({
      message: "Lỗi khi phân tích dữ liệu",
      error: error.message
    });
  }
};

function extractDateParams(query: any) {
  const params: any = { type: query.type || "day" };
  if (query.specificDate) params.specificDate = query.specificDate;
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate) params.endDate = query.endDate;
  if (query.startHour) params.startHour = parseInt(query.startHour);
  if (query.endHour) params.endHour = parseInt(query.endHour);
  if (query.startDay) params.startDay = parseInt(query.startDay);
  if (query.endDay) params.endDay = parseInt(query.endDay);
  if (query.startDayOfMonth) params.startDayOfMonth = parseInt(query.startDayOfMonth);
  if (query.endDayOfMonth) params.endDayOfMonth = parseInt(query.endDayOfMonth);
  if (query.startMonth) params.startMonth = parseInt(query.startMonth);
  if (query.endMonth) params.endMonth = parseInt(query.endMonth);
  return params;
}

async function fetchAdditionalData(params: any) {
  // Use getTimeRange from dashboard service
  const timeRange = (dashboardService as any).getTimeRange(params);
  const { start, end } = timeRange;

  const [orderStats, lowStock, reviewStats] = await Promise.all([
    // Order statistics
    databaseService.orders.aggregate([
      { $match: { 
          createdAt: { $gte: start, $lte: end },
          paymentStatus: PaymentStatus.PAID 
      }},
      { $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
      }}
    ]).toArray(),

    // Low stock ingredients
    databaseService.ingredients.find({
      deleted: false,
      $expr: { $lte: ["$currentStock", "$minStock"] }
    }).limit(10).toArray(),

    // Review statistics
    databaseService.reviews.aggregate([
      { $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
      }}
    ]).toArray()
  ]);

  const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0 };
  const reviews = reviewStats[0] || { avgRating: 0, totalReviews: 0 };

  return {
    totalOrders: stats.totalOrders,
    totalRevenue: stats.totalRevenue,
    avgOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
    lowStockIngredients: lowStock,
    averageRating: reviews.avgRating || 0,
    totalReviews: reviews.totalReviews || 0
  };
}
