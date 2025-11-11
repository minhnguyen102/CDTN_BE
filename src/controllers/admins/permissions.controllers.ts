import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import { createPermissionReqBody, updatePermissionReqBody } from "../../models/requests/Permission.request"
import permissionServices from "../../services/permissions.services"
import HTTP_STATUS from "../../constants/httpStatus"

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

export const updatePermissionController = async (
  req: Request<ParamsDictionary, any, updatePermissionReqBody>,
  res: Response
) => {
  const { permission_id } = req.params
  const payload = pick(req.body, ["name", "description", "module"])
  const result = await permissionServices.updatePermission({ permission_id, payload })

  // Nếu service trả về null, nghĩa là không tìm thấy permission với ID đó
  if (!result) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.PERMISSION_NOT_FOUND
    })
  }

  return res.json({
    message: USER_MESSAGES.UPDATE_PERMISSION_SUCCESS,
    result: result
  })
}
