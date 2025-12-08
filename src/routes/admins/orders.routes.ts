import { Router } from "express"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { getAllOrdersController } from "../../controllers/admins/orders.controllers"
const ordersRouter = Router()

/**
 * Description: Get all orders (Dành cho trang admin)
 * Path: /orders
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 * Query Params: ?page=1&limit=10&status=Pending
 */
ordersRouter.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_orders"),
  wrapHandlerFunction(getAllOrdersController)
)

export default ordersRouter
