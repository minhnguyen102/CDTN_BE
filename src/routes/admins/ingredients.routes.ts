import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { createIngredientValidation } from "../../middlewares/admins/ingredients.middlewares"

import {
  createIngredientController
  // listIngredientsController,
  // getIngredientDetailController,
  // updateIngredientController,
  // updateIngredientStatusController
} from "../../controllers/admins/ingredient.controllers"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"

const ingredientRoutes = Router()

/**
 * Description: Create a new ingredient
 * PATH: admin/ingredients
 * Method: POST
 * Body: { name: string, categoryId: string, unit: string, unitPrice: number, minStock: number }
 * Headers: {Authorization: Bearer access_token}
 */
ingredientRoutes.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  // checkPermission("create_ingredient"),
  createIngredientValidation,
  wrapHandlerFunction(createIngredientController)
)

/**
 * Description: Get list of ingredients (with pagination, search, filter)
 * PATH: admin/ingredients
 * Method: GET
 * Query: { page?: number, limit?: number, search?: string, categoryId?: string, status?: string }
 * Headers: {Authorization: Bearer access_token}
 */
ingredientRoutes.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation
  // checkPermission("view_ingredients")
  // wrapHandlerFunction(listIngredientsController)
)

/**
 * Description: Update an ingredient
 * PATH: admin/ingredients/update/:id
 * Method: PUT
 * Params: { id: string }
 * Body: { name: string, categoryId: string, unit: string, unitPrice: number, minStock: number }
 * Headers: {Authorization: Bearer access_token}
 */
// ingredientRoutes.put(
//   "/update/:id",
//   accessTokenValidation,
//   verifiedUserValidation,
//   checkPermission("update_ingredient"),
//   isObjectIdValidation("id"), // Kiểm tra params.id
//   updateIngredientValidation, // Kiểm tra body
//   wrapHandlerFunction(updateIngredientController)
// )

/**
 * Description: Deactivate/Reactivate an ingredient (Soft Delete)
 * PATH: admin/ingredients/status/:id
 * Method: PATCH
 * Params: { id: string }
 * Body: { status: "Active" | "Inactive" }
 * Headers: {Authorization: Bearer access_token}
 */
// ingredientRoutes.patch(
//   "/status/:id",
//   accessTokenValidation,
//   verifiedUserValidation,
//   checkPermission("delete_ingredient"),
//   isObjectIdValidation("id"), // Kiểm tra params.id
//   updateIngredientStatusValidation, // Kiểm tra body.status
//   wrapHandlerFunction(updateIngredientStatusController)
// )

export default ingredientRoutes
