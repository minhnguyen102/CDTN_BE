import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import orderServices from "../../services/orders.services"
import { paginationQueryParser } from "../../utils/helpers"
import { CreateOrderForTableController, UpdateStatusItemInOrdersReqBody } from "../../models/requests/Order.request"
import { OrderItemStatus } from "../../constants/enums"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import { TokenPayload } from "../../models/requests/Account.request"

export const getAllOrdersController = async (req: Request, res: Response) => {
  const { limit, page } = paginationQueryParser(req, { defaultLimit: 15, allowLimits: [15, 20, 25] })

  const status = (req.query.status as string) || undefined
  const search = (req.query.search as string) || undefined
  const dateFrom = (req.query.dateFrom as string) || undefined
  const dateTo = (req.query.dateTo as string) || undefined

  const result = await orderServices.getAllOrders({ limit, page, status, search, dateFrom, dateTo })

  return res.json({
    message: "Get all orders successfully",
    data: result
  })
}

export const updateStatusItemInOrdersController = async (
  req: Request<ParamsDictionary, any, UpdateStatusItemInOrdersReqBody>,
  res: Response
) => {
  const { order_id, item_id } = req.params
  const { status } = req.body

  const { user_id } = req.decoded_access_token as TokenPayload

  if (!Object.values(OrderItemStatus).includes(status)) {
    return new ErrorWithStatus({
      message: "Invalid status",
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
  const result = await orderServices.updateItemStatus({
    orderId: order_id,
    itemId: item_id,
    status: status,
    admin_id: user_id
  })

  return res.json({
    message: "Update item status successfully",
    data: result
  })
}

export const adminCreateOrderForTableController = async (
  req: Request<ParamsDictionary, any, CreateOrderForTableController>,
  res: Response
) => {
  const { tableId, guestName, items } = req.body
  const { user_id } = req.decoded_access_token as TokenPayload

  const result = await orderServices.createOrderForTable({
    tableId,
    guestName,
    items,
    adminId: user_id
  })

  return res.json({
    message: "Order created/updated successfully",
    data: result
  })
}
