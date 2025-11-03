import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { createTableReqBody } from "~/models/requests/Account.request"

export const createTableController = async (req: Request<ParamsDictionary, any, createTableReqBody>, res: Response) => {
  res.json({
    message: "Ok"
  })
}
