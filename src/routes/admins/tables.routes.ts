import { Router } from "express"
import {
  createTableController,
  getAllTablesController,
  regenerateQrTokenController,
  updateTableController
} from "../../controllers/admins/tables.controllers"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import {
  createTableValidation,
  regenerateQrTokenValidation,
  updateTableValidation
} from "../../middlewares/admins/tables.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"

const tableRoutes = Router()

/**
 * Description: view all table
 * PATH: admin/tables
 * Method: GET
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_tables"),
  wrapHandlerFunction(getAllTablesController)
)

/**
 * Description: Create table
 * PATH: admin/tables/create
 * Method: POST
 * Body: { capacity: number }
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("create_table"),
  createTableValidation,
  wrapHandlerFunction(createTableController)
)

/**
 * Description: update table
 * PATH: admin/tables/update/:id
 * Method: PATCH
 * Body: { capacity?: number, status?: TableStatus }
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.patch(
  "/:id",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("update_table"),
  updateTableValidation,
  wrapHandlerFunction(updateTableController)
)

/**
 * Description: Regenarate QR token
 * PATH: admin/tables/update/:id/qr-token
 * Method: PATCH
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.patch(
  "/:id/qr-token",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("regenerate_table_qr"),
  regenerateQrTokenValidation,
  wrapHandlerFunction(regenerateQrTokenController)
)

export default tableRoutes
