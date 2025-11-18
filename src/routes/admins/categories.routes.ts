import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { createCategoryValidation, updateCategoryValidation } from "../../middlewares/admins/category.middlewares"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import {
  createCategoryController,
  getAllCategoryController,
  updateCategoryController
} from "../../controllers/admins/categories.controllers"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
const categoriesRouter = Router()

/**
 * Description: get all category
 * PATH: admin/categories/
 * Headers: {Authorization: Bearer access_token}
 * Method: GET
 */
categoriesRouter.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_ingredient_category_list"),
  wrapHandlerFunction(getAllCategoryController)
)

/**
 * Description: Create category
 * PATH: admin/categories/
 * Method: POST
 * Headers: {Authorization: Bearer access_token}
 * Body: { name: string, description: string, status: CategoryTypeStatus }
 */
categoriesRouter.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("create_ingredient_category"),
  createCategoryValidation,
  wrapHandlerFunction(createCategoryController)
)

/**
 * Description: update category
 * PATH: admin/categories/
 * Method: PATCH
 * Headers: {Authorization: Bearer access_token}
 * Body: { name?: string, description?: string, status?: CategoryTypeStatus }
 */
categoriesRouter.patch(
  "/:id",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("update_ingredient_category"),
  updateCategoryValidation,
  wrapHandlerFunction(updateCategoryController)
)

export default categoriesRouter
