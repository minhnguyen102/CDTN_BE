import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { createTableReqBody, updateTableReqBody } from "../../models/requests/Account.request"
import tableServices from "../../services/tables.services"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"

export const createTableController = async (req: Request<ParamsDictionary, any, createTableReqBody>, res: Response) => {
  const { capacity } = req.body
  const result = await tableServices.createTable({ capacity })
  res.json({
    message: USER_MESSAGES.CREATE_TABLE_SUCCESS,
    result
  })
}

export const getAllTablesController = async (req: Request, res: Response) => {
  const { page } = req.query
  // Xử lí page
  let pageQuery = 1
  if (typeof page === "string") {
    const parsePage = parseInt(page, 10)
    if (!isNaN(parsePage) && parsePage > 0) {
      pageQuery = parsePage
    }
  }

  // Xử lí status
  const status = (req.query.status as string) || undefined
  const result = await tableServices.getAllTablesController({ page: pageQuery, status })
  res.json({
    message: USER_MESSAGES.GET_ALL_TABLES_SUCCESS,
    ...result
  })
}

export const updateTableController = async (req: Request<ParamsDictionary, any, updateTableReqBody>, res: Response) => {
  const { id } = req.params
  const payload = pick(req.body, ["capacity", "status"])
  const result = await tableServices.updateTable({ payload, id })
  res.json({
    message: USER_MESSAGES.UPDATE_TABLE_SUCCESS,
    table: result
  })
}

export const regenerateQrTokenController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params
  const table = await tableServices.regenerateQrToken({ id })
  res.json({
    message: USER_MESSAGES.REGENERATE_QR_TOKEN_SUCCESS,
    table
  })
}
