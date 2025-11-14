import { Router } from "express"
import {
  createPermissionController,
  deletePermissionController,
  getAllPermissionsController,
  updatePermissionController
} from "../../controllers/admins/permissions.controllers"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import {
  createPermissionValidation,
  permissionIdValidation,
  updatePermissionValidation
} from "../../middlewares/admins/permissions.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"

const permissionsRouter = Router()

/**
 * Description: Create a new permission
 * PATH: admin/permissions
 * Method: POST
 * Headers: {Authorization: Bearer access_token}
 * Body: createPermissionReqBody
 */
permissionsRouter.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  createPermissionValidation,
  wrapHandlerFunction(createPermissionController)
)

/**
 * Description: Get all permissions
 * PATH: admin/permissions
 * Method: GET
 * Headers: {Authorization: Bearer access_token}
 */
permissionsRouter.get(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  wrapHandlerFunction(getAllPermissionsController)
)

/**
 * Description: Update a permission by ID
 * PATH: admin/permissions/:permission_id
 * Method: PATCH
 * Headers: {Authorization: Bearer access_token}
 * Body: updatePermissionReqBody
 */
permissionsRouter.patch(
  "/:permission_id",
  accessTokenValidation,
  verifiedUserValidation,
  updatePermissionValidation,
  wrapHandlerFunction(updatePermissionController)
)

/**
 * Description: Delete a permission by ID
 * PATH: admin/permissions/:permission_id
 * Method: DELETE
 * Headers: {Authorization: Bearer access_token}
 */
permissionsRouter.delete(
  "/:permission_id",
  accessTokenValidation,
  verifiedUserValidation,
  permissionIdValidation,
  wrapHandlerFunction(deletePermissionController)
)

export default permissionsRouter
