import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { createTableReqBody } from "../../models/requests/Account.request"
import tableServices from "../../services/tables.services"

export const createTableController = async (req: Request<ParamsDictionary, any, createTableReqBody>, res: Response) => {
  const { capacity } = req.body
  const result = await tableServices.createTable({ capacity })
  res.json({
    message: "OK",
    result
  })
}

export const getAllTablesController = async (
  req: Request<ParamsDictionary, any, createTableReqBody>,
  res: Response
) => {
  const result = await tableServices.viewTableController()
  res.json({
    result
  })
}
