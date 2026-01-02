import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import { createTableReqBody, updateTableReqBody } from "../../models/requests/Account.request"
import tableServices from "../../services/tables.services"
import { paginationQueryParser } from "../../utils/helpers"

export const createTableController = async (req: Request<ParamsDictionary, any, createTableReqBody>, res: Response) => {
  const { capacity } = req.body
  const result = await tableServices.createTable({ capacity })
  res.json({
    message: USER_MESSAGES.CREATE_TABLE_SUCCESS,
    result
  })
}

export const getAllTablesController = async (req: Request, res: Response) => {
  // Phân trang
  const { page, limit } = paginationQueryParser(req, { defaultLimit: 5 })

  // Xử lí status
  const status = (req.query.status as string) || undefined

  // Xử lí search
  let searchNumber: number | undefined = undefined
  const search = (req.query.search as string) || undefined
  if (search) {
    const parsedNumber = parseInt(search, 10)
    if (!isNaN(parsedNumber)) {
      searchNumber = parsedNumber
    }
  }
  // Xử lí capacity
  let capacityFilter: number | undefined = undefined
  const capacity = (req.query.capacity as string) || undefined
  if (capacity) {
    const parsedCapacity = parseInt(capacity, 10)
    if (!isNaN(parsedCapacity) && parsedCapacity > 0) {
      capacityFilter = parsedCapacity
    }
  }

  const result = await tableServices.getAllTables({
    page,
    status,
    limit,
    search: searchNumber,
    capacity: capacityFilter
  })
  res.json({
    message: USER_MESSAGES.GET_ALL_TABLES_SUCCESS,
    result
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
