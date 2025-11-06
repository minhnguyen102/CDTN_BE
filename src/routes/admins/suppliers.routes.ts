import { Router } from "express"
import { createSupplierValidation } from "../../middlewares/admins/suppliers.middlewares"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { createSupplierController } from "../../controllers/admins/suppliers.controllers"

const supplierRoutes = Router()

/**
 * Description: Login
 * PATH: admin/accounts/register
 * Method: POST
 * Body: { name: string, taxCode: string, status: SupplierStatus, contactPerson: string, phone: string, email: string, address: string }
 */
supplierRoutes.post(
  "/create",
  accessTokenValidation,
  verifiedUserValidation,
  createSupplierValidation,
  wrapHandlerFunction(createSupplierController)
)

export default supplierRoutes
