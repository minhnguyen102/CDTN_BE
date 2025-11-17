import { Router } from "express"
import {
  createRoleController,
  deleteRoleController,
  getAllRolesController,
  updateRoleController
} from "../../controllers/admins/roles.controllers"
import { accessTokenValidation, verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { createRoleValidation, roleIdValidation, updateRoleValidation } from "../../middlewares/admins/role.middlewares"
import { wrapHandlerFunction } from "../../utils/wrapHandler"

const rolesRouter = Router()

/**
 * Description: Create a new role
 * PATH: admin/roles
 * Method: POST
 * Headers: {Authorization: Bearer access_token}
 * Body: createRoleReqBody
 */
rolesRouter.post(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  createRoleValidation,
  wrapHandlerFunction(createRoleController)
)

/**
 * Description: Get all roles
 * PATH: admin/roles
 * Method: GET
 * Headers: {Authorization: Bearer access_token}
 */
rolesRouter.get("/", accessTokenValidation, verifiedUserValidation, wrapHandlerFunction(getAllRolesController))

/**
 * Description: Update a role by ID
 * PATH: admin/roles/:role_id
 * Method: PATCH
 * Headers: {Authorization: Bearer access_token}
 * Body: updateRoleReqBody
 */
rolesRouter.patch(
  "/:role_id",
  accessTokenValidation,
  verifiedUserValidation,
  roleIdValidation,
  updateRoleValidation,
  wrapHandlerFunction(updateRoleController)
)

/**
 * Description: Delete a role by ID
 * PATH: admin/roles/:role_id
 * Method: DELETE
 * Headers: {Authorization: Bearer access_token}
 */
rolesRouter.delete(
  "/:role_id",
  accessTokenValidation,
  verifiedUserValidation,
  roleIdValidation,
  wrapHandlerFunction(deleteRoleController)
)

export default rolesRouter
