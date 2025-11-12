import { Router } from "express"
import {
  createSupplierValidation,
  supplierIdValidation,
  updateSupplierValidation
} from "../../middlewares/admins/suppliers.middlewares"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import {
  createSupplierController,
  deleteSupplierController,
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
 * PATH: admin/suppliers
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
 * PATH: admin/suppliers/:id
 * Method: PATCH
 * Headers: {Authorization: Bearer access_token}
 * Body: { name?: string, taxCode?: string, status?: SupplierStatus, contactPerson?: string, phone?: string, email?: string, address?: string }
 */
supplierRoutes.patch(
  "/:supplier_id",
  accessTokenValidation,
  verifiedUserValidation,
  updateSupplierValidation,
  wrapHandlerFunction(updateSupplierController)
)

/**
 * Description: Delete supplier
 * PATH: admin/suppliers/:id
 * Method: DELETE
 * Headers: {Authorization: Bearer access_token}
 */
supplierRoutes.delete(
  "/:supplier_id",
  accessTokenValidation,
  verifiedUserValidation,
  supplierIdValidation,
  wrapHandlerFunction(deleteSupplierController)
)

export default supplierRoutes
