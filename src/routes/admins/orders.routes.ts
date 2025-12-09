import { Router } from "express"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { getAllOrdersController, updateStatusItemInOrdersController } from "../../controllers/admins/orders.controllers"
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
 * Description: update status món ăn trong order
 * Path: /orders/:order_id/:item_id
 * Method: PATCH
 * Headers: { Authorization: Bearer <access_token> }
 */
ordersRouter.patch(
  "/:order_id/:item_id",
  accessTokenValidation,
  verifiedUserValidation,
  // checkPermission("update_orders"),
  wrapHandlerFunction(updateStatusItemInOrdersController)
)

export default ordersRouter
