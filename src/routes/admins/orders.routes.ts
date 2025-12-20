import { Router } from "express"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import {
  adminCreateOrderForTableController,
  getAllOrdersController,
  getAllOrdersHistoryController,
  updateStatusItemInOrdersController
} from "../../controllers/admins/orders.controllers"
import { adminCreateOrderValidation } from "../../middlewares/admins/orders.middlewares"
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
/**
 * Description: Get all orders (Dành cho trang admin)
 * Path: /orders
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 * Query Params: ?page=1&limit=10&status=Pending
 */
ordersRouter.get(
  "/history",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_orders"),
  wrapHandlerFunction(getAllOrdersHistoryController)
)

/**
 * Description: update status món ăn trong order
 * Path: /orders/:order_id/:item_id
 * Method: PATCH
 * Headers: { Authorization: Bearer <access_token> }
 */
ordersRouter.patch(
  "/:order_id/:item_id",
  accessTokenValidation,
  verifiedUserValidation,
  // checkPermission("update_order"), // chưa tạo mới quyền này
  wrapHandlerFunction(updateStatusItemInOrdersController)
)

/**
 * Description: Admin tạo đơn cho bàn (Dùng cho khách có nhu cầu gọi hộ)
 * Path: /orders/create
 * Method: POST
 * Body: { tableId: "...", guestName, items: [...] }
 */
ordersRouter.post(
  "/create",
  accessTokenValidation,
  // checkPermission("create_order"), // admin chưa có
  adminCreateOrderValidation,
  wrapHandlerFunction(adminCreateOrderForTableController)
)

export default ordersRouter
