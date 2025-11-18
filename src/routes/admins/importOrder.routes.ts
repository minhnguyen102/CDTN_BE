import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { createImportOrderValidation, importOrderIdValidator } from "../../middlewares/admins/importOrder.middlewares"
import {
  createImportOrderController,
  getImportOrderDetailController,
  getImportOrdersController
} from "../../controllers/admins/importOrders.controllers"

const importOrderRoutes = Router()

/**
 * Description: Create a new import order (as Draft or Confirmed)
 * PATH: admin/import-orders/create
 * Method: POST
 * Body: {
 * supplierId: string,
 * importDate: string (ISO Date),
 * status: "Draft" | "Confirmed",
 * items: [ { ingredientId: string, quantity: number, importPrice: number } ],
 * taxRate?: number,
 * notes?: string
 * }
 * Headers: {Authorization: Bearer access_token}
 */
importOrderRoutes.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  createImportOrderValidation,
  wrapHandlerFunction(createImportOrderController)
)

/**
 * Description: Get list of import orders
 * PATH: admin/import-orders
 * Method: GET
 * Query: ?page=1&limit=10&search=PO-2025&status=Confirmed&dateFrom=...&dateTo=...
 * Headers: {Authorization: Bearer access_token}
 */
importOrderRoutes.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  wrapHandlerFunction(getImportOrdersController)
)

/**
 * Description: Get import order detail by ID
 * PATH: admin/import-orders/:id
 * Method: GET
 * Params: { id: string }
 */
importOrderRoutes.get(
  "/:id",
  accessTokenValidation,
  verifiedUserValidation,
  importOrderIdValidator, // Middleware kiểm tra ID hợp lệ
  wrapHandlerFunction(getImportOrderDetailController)
)

export default importOrderRoutes
