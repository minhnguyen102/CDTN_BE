import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { uploadCloud } from "../../utils/cloudinary"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import { createDishValidation, updateDishValidation } from "../../middlewares/admins/dish.middlewares"
import {
  createDishController,
  getListDishController,
  updateDishController
} from "../../controllers/admins/dishs.controllers"

const dishesRoutes = Router()

/**
 * Description: Create a new dish
 * PATH: /
 * Method: POST
 * Content-Type: multipart/form-data
 * Body: {
 * name: string,
 * price: number,
 * description: string,
 * image: File,
 * status: string (Enum),
 * categoryId: string (ObjectId),
 * recipe: JSON String (Array),
 * isFeatured: boolean
 * }
 * Headers: { Authorization: Bearer <access_token> }
 */
dishesRoutes.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("create_dish"),
  uploadCloud.single("image"),
  createDishValidation,
  wrapHandlerFunction(createDishController)
)

/**
 * Description: Get list of dishes (Filter & Search & Pagination)
 * PATH: /admin/dishes
 * Method: GET
 * Query:
 * - page: number
 * - limit: number
 * - search: string (Tên món)
 * - status: string (Available, Unavailable...)
 * - categoryId: string (ObjectId)
 * - isFeatured: boolean (true/false)
 * - minPrice: number
 * - maxPrice: number
 */
dishesRoutes.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("view_dishes"),
  wrapHandlerFunction(getListDishController)
)

dishesRoutes.patch(
  "/:id",
  accessTokenValidation,
  verifiedUserValidation,
  checkPermission("update_dish"),
  uploadCloud.single("image"),
  updateDishValidation,
  wrapHandlerFunction(updateDishController)
)

export default dishesRoutes
