import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { uploadCloud } from "../../utils/cloudinary"
import { checkPermission } from "../../middlewares/admins/auth.middlewares"
import { createDishValidation } from "../../middlewares/admins/dish.middlewares"

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
  createDishValidation
  // wrapHandlerFunction(createDishController)
)

export default dishesRoutes
