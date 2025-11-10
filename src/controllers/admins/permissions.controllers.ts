import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import roleServices from "../../services/roles.services"
import { createPermissionReqBody } from "../../models/requests/Permission.request"
import permissionServices from "../../services/permissions.services"

export const createPermissionController = async (
  req: Request<ParamsDictionary, any, createPermissionReqBody>,
  res: Response
) => {
  const payload = req.body
  const result = await permissionServices.createPermission({ payload })
  res.json({
    message: "OK",
    result
  })
}

export const getAllPermissionsController = async (req: Request, res: Response) => {
  // Gọi service để thực hiện logic
  const result = await permissionServices.getAllPermissions()

  // Trả về kết quả
  return res.json({
    message: USER_MESSAGES.GET_ALL_PERMISSIONS_SUCCESS, // Thêm message này
    result: result
  })
}
