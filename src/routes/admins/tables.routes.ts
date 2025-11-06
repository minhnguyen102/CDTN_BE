import { Router } from "express"
import {
  createTableController,
  getAllTablesController,
  updateTableController
} from "../../controllers/admins/tables.controllers"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { createTableValidation, updateTableValidation } from "../../middlewares/admins/tables.middlewares"

const tableRoutes = Router()

/**
 * Description: view all table
 * PATH: admin/tables
 * Method: GET
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.get("/", accessTokenValidation, verifiedUserValidation, getAllTablesController)

/**
 * Description: Create table
 * PATH: admin/tables/create
 * Method: POST
 * Body: { capacity: number }
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.post("/create", accessTokenValidation, verifiedUserValidation, createTableValidation, createTableController)

/**
 * Description: update table
 * PATH: admin/tables/update
 * Method: PATCH
 * Body: { capacity: number }
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.patch(
  "/update/:id",
  accessTokenValidation,
  verifiedUserValidation,
  updateTableValidation,
  updateTableController
)

export default tableRoutes
