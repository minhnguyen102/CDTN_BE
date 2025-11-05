import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { createTableReqBody } from "../../models/requests/Account.request"
import tableServices from "../../services/tables.services"
import { paginationHelper } from "../../utils/helpers"

export const createTableController = async (req: Request<ParamsDictionary, any, createTableReqBody>, res: Response) => {
  const { capacity } = req.body
  const result = await tableServices.createTable({ capacity })
  res.json({
    message: "OK",
    result
  })
}

export const getAllTablesController = async (req: Request, res: Response) => {
  const { page } = req.query
  let pageQuery = 1
  if (typeof page === "string") {
    const parsePage = parseInt(page, 10)
    if (!isNaN(parsePage) && parsePage > 0) {
      pageQuery = parsePage
    }
  }
  const result = await tableServices.getAllTablesController({ page: pageQuery })
  res.json({
    message: "OK",
    ...result
  })
}
