import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { createImportOrderValidation } from "../../middlewares/admins/importOrder.middlewares"

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
  (req, res) => {
    res.json("OK")
  }
  // wrapHandlerFunction(createImportOrderController)
)

// ... (Các routes khác: get list, get detail, ...)

export default importOrderRoutes
