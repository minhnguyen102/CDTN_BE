import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { getPublicDishesController } from "../../controllers/public/dishes.contrellers"

const publicsRouter = Router()

/**
 * Path: /dishes/public
 * Method: GET
 * Access: Public (Ai cũng gọi được)
 */
publicsRouter.get("/dishes/public", wrapHandlerFunction(getPublicDishesController))

export default publicsRouter
