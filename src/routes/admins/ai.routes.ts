import { Router } from "express";
import { analyzeRestaurantController } from "../../controllers/admins/ai.controllers";
import { accessTokenValidation } from "../../middlewares/admins/accounts.middlewares";

const aiRouter = Router();

/**
 * GET /admin/ai/analyze
 * Analyze restaurant data with AI
 * Query params: type, specificDate, startDate, endDate, startMonth, endMonth, etc.
 */
aiRouter.get(
  "/analyze",
  accessTokenValidation,
  analyzeRestaurantController
);

export default aiRouter;
