import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import {
  createDishCategoryController
  // getDishCategoriesController,
  // getDishCategoryDetailController,
  // updateDishCategoryController,
  // deleteDishCategoryController
} from "../../controllers/admins/dishCategories.controllers"
import {
  createDishCategoryValidator,
  updateDishCategoryValidator,
  dishCategoryIdValidator
} from "../../middlewares/admins/dishCategories.middlewares"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"

const dishCategoriesRoutes = Router()

/**
 * Description: Create a new dish category
 * PATH: /
 * Method: POST
 * Body: { name: string, description?: string, image?: string, displayOrder?: number, status?: string }
 * Headers: { Authorization: Bearer <access_token> }
 */
dishCategoriesRoutes.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("create_dish_category"),
  createDishCategoryValidator,
  wrapHandlerFunction(createDishCategoryController)
)

/**
 * Description: Get list of dish categories
 * PATH: /
 * Method: GET
 * Query: ?page=1&limit=10&search=abc&status=Active
 * Headers: { Authorization: Bearer <access_token> }
 */
// dishCategoriesRoutes.get(
//   "/",
//   accessTokenValidation,
//   verifiedUserValidation,
//   checkPermission("view_dish_category_list"),
//   wrapHandlerFunction(getDishCategoriesController)
// )

/**
 * Description: Update a dish category
 * PATH: /:id
 * Method: PUT
 * Params: { id: string }
 * Body: { name?: string, description?: string, image?: string, displayOrder?: number, status?: string }
 * Headers: { Authorization: Bearer <access_token> }
 */
// dishCategoriesRoutes.put(
//   "/:id",
//   accessTokenValidation,
//   verifiedUserValidation,
//   checkPermission("update_dish_category"),
//   dishCategoryIdValidator, // Validate param ID
//   updateDishCategoryValidator, // Validate body
//   wrapHandlerFunction(updateDishCategoryController)
// )

/**
 * Description: Delete (or Soft Delete) a dish category
 * PATH: /:id
 * Method: DELETE
 * Params: { id: string }
 * Headers: { Authorization: Bearer <access_token> }
 */
// dishCategoriesRoutes.delete(
//   "/:id",
//   accessTokenValidation,
//   verifiedUserValidation,
//   checkPermission("delete_dish_category"),
//   dishCategoryIdValidator, // Validate param ID
//   wrapHandlerFunction(deleteDishCategoryController)
// )

export default dishCategoriesRoutes
