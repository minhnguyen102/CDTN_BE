import { Router } from "express"
import { createSupplierValidation, updateSupplierValidation } from "../../middlewares/admins/suppliers.middlewares"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import {
  createSupplierController,
  updateSupplierController,
  viewAllSupplierController
} from "../../controllers/admins/suppliers.controllers"

const supplierRoutes = Router()

/**
 * Description: read all Supplier
 * PATH: admin/suppliers
 * Method: GET
 * Headers: {Authorization: Bearer access_token}
 */
supplierRoutes.get("/", accessTokenValidation, verifiedUserValidation, wrapHandlerFunction(viewAllSupplierController))

/**
 * Description: Create Supplier
 * PATH: admin/suppliers/create
 * Method: POST
 * Headers: {Authorization: Bearer access_token}
 * Body: { name: string, taxCode: string, status: SupplierStatus, contactPerson: string, phone: string, email: string, address: string }
 */
supplierRoutes.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  createSupplierValidation,
  wrapHandlerFunction(createSupplierController)
)

/**
 * Description: Update supplier
 * PATH: admin/suppliers/update/:id
 * Method: POST
 * Headers: {Authorization: Bearer access_token}
 * Body: { name?: string, taxCode?: string, status?: SupplierStatus, contactPerson?: string, phone?: string, email?: string, address?: string }
 */
supplierRoutes.patch(
  "/:id",
  accessTokenValidation,
  verifiedUserValidation,
  updateSupplierValidation,
  wrapHandlerFunction(updateSupplierController)
)

export default supplierRoutes
