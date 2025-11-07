import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { createCategoryValidation } from "../../middlewares/admins/category.middlewares"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { createCategoryController } from "../../controllers/admins/categories.controllers"
const categoriesRouter = Router()

/**
 * Description: Create category
 * PATH: admin/categories/
 * Method: POST
 * Body: { name: string, description: string, status: CategoryTypeStatus }
 */
categoriesRouter.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  createCategoryValidation,
  wrapHandlerFunction(createCategoryController)
)

export default categoriesRouter
