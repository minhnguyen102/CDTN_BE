import { Router } from "express"
import { createTableController } from "~/controllers/admins/tables.controllers"
import { accessTokenValidation, verifiedUserValidation } from "~/middlewares/admins/validation.middlewares"

const tableRoutes = Router()

/**
 * Description: Create table
 * PATH: admin/tables/create
 * Method: POST
 * Body: { number: number, capacity: number }
 */
tableRoutes.post("/create", accessTokenValidation, verifiedUserValidation, createTableController)

export default tableRoutes
