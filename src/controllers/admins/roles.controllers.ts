import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { createRoleReqBody, updateRoleReqBody } from "../../models/requests/Role.request"
import roleServices from "../../services/roles.services"
import HTTP_STATUS from "../../constants/httpStatus"
import { pick } from "lodash"
import { ObjectId } from "mongodb"

export const createRoleController = async (req: Request<ParamsDictionary, any, createRoleReqBody>, res: Response) => {
  const payload = req.body
  const result = await roleServices.createRole({ payload })
  res.json({
    message: USER_MESSAGES.CREATE_ROLE_SUCCESS,
    result
  })
}

export const getAllRolesController = async (req: Request, res: Response) => {
  const result = await roleServices.getAllRoles()
  return res.json({
    message: USER_MESSAGES.GET_ALL_ROLES_SUCCESS,
    result: result
  })
}

export const updateRoleController = async (req: Request<ParamsDictionary, any, updateRoleReqBody>, res: Response) => {
  const { role_id } = req.params
  const payload = pick(req.body, ["name", "description", "status", "permissionIds"])

  const result = await roleServices.updateRole({ role_id, payload })
  return res.json({
    message: USER_MESSAGES.UPDATE_ROLE_SUCCESS,
    result: result
  })
}

export const deleteRoleController = async (req: Request, res: Response) => {
  const { role_id } = req.params
  const result = await roleServices.deleteRole(role_id)

  // Nếu service trả về false (modifiedCount = 0) -> Không tìm thấy
  if (!result) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.ROLE_NOT_FOUND
    })
  }

  return res.json({
    message: USER_MESSAGES.DELETE_ROLE_SUCCESS
  })
}
