import { Router } from "express"
import { createTableController, getAllTablesController } from "../../controllers/admins/tables.controllers"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { createTableValidation } from "../../middlewares/admins/tables.middlewares"

const tableRoutes = Router()

/**
 * Description: Create table
 * PATH: admin/tables/create
 * Method: POST
 * Body: { number: number, capacity: number }
 * * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.post("/create", accessTokenValidation, verifiedUserValidation, createTableValidation, createTableController)

/**
 * Description: view all table
 * PATH: admin/tables
 * Method: GET
 * Headers: {Authorization: Bearer access_token}
 */
tableRoutes.get("/", accessTokenValidation, verifiedUserValidation, getAllTablesController)

export default tableRoutes
