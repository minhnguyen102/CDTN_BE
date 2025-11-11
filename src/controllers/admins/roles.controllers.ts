import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import { createRoleReqBody } from "../../models/requests/Role.request"
import roleServices from "../../services/roles.services"
import { ObjectId } from "mongodb"

export const createRoleController = async (req: Request<ParamsDictionary, any, createRoleReqBody>, res: Response) => {
  const payload = req.body
  const result = await roleServices.createRole({ payload })
  res.json({
    message: "OK",
    result
  })
}
