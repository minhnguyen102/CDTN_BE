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

const tableRoutes = Router()

/**
 * Description: view all table
 * PATH: admin/tables
 * Method: GET
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.get("/", accessTokenValidation, verifiedUserValidation, wrapHandlerFunction(getAllTablesController))

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
  regenerateQrTokenValidation,
  wrapHandlerFunction(regenerateQrTokenController)
)

export default tableRoutes
