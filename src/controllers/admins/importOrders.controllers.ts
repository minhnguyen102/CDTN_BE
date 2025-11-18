// src/modules/import-orders/importOrder.controller.ts
import { Request, Response } from "express"
import USER_MESSAGES from "../../constants/message"
import HTTP_STATUS from "../../constants/httpStatus"
import { ParamsDictionary } from "express-serve-static-core"
import { CreateImportOrderReqBody } from "../../models/requests/ImportOrder.request"
import importOderService from "../../services/importOrders.services"
import { JwtPayload } from "jsonwebtoken"
import { paginationQueryParser } from "../../utils/helpers"

export const createImportOrderController = async (
  req: Request<ParamsDictionary, any, CreateImportOrderReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_access_token as JwtPayload

  // Gọi service
  const result = await importOderService.create({ payload: req.body, user_id })

  return res.status(HTTP_STATUS.CREATED).json({
    message: USER_MESSAGES.IMPORT_ORDER_CREATED_SUCCESSFULLY,
    result
  })
}

export const getImportOrdersController = async (req: Request, res: Response) => {
  const { page, limit } = paginationQueryParser(req, {
    defaultLimit: 10,
    allowLimits: [10, 15, 20]
  })

  const search = (req.query.search as string) || undefined
  const status = (req.query.status as string) || undefined
  const supplierId = (req.query.supplierId as string) || undefined
  const dateFrom = (req.query.dateFrom as string) || undefined
  const dateTo = (req.query.dateTo as string) || undefined

  const result = await importOderService.getList({
    page,
    limit,
    search,
    status,
    supplierId,
    dateFrom,
    dateTo
  })

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.IMPORT_ORDERS_FETCHED_SUCCESSFULLY,
    data: result
  })
}

export const getImportOrderDetailController = async (req: Request, res: Response) => {
  const { id } = req.params

  const importOrder = await importOderService.getDetail({ id })

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.IMPORT_ORDER_DETAIL_FETCHED_SUCCESSFULLY,
    data: importOrder
  })
}
