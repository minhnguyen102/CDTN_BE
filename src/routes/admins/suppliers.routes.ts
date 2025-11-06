import { Router } from "express"
import { createSupplierValidation, updateSupplierValidation } from "../../middlewares/admins/suppliers.middlewares"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { createSupplierController, updateSupplierController } from "../../controllers/admins/suppliers.controllers"

const supplierRoutes = Router()

/**
 * Description: Create Supplier
 * PATH: admin/suppliers/create
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

/**
 * Description: Login
 * PATH: admin/suppliers/update/:id
 * Method: POST
 * Body: { name?: string, taxCode?: string, status?: SupplierStatus, contactPerson?: string, phone?: string, email?: string, address?: string }
 */
supplierRoutes.patch(
  "/update/:id",
  accessTokenValidation,
  verifiedUserValidation,
  updateSupplierValidation,
  wrapHandlerFunction(updateSupplierController)
)

export default supplierRoutes
