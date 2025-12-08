import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import orderServices from "../../services/orders.services"
import { paginationQueryParser } from "../../utils/helpers"

export const getAllOrdersController = async (req: Request, res: Response) => {
  const { limit, page } = paginationQueryParser(req, { defaultLimit: 15, allowLimits: [15, 20, 25] })

  const status = (req.query.status as string) || undefined

  const result = await orderServices.getAllOrders({ limit, page, status })

  return res.json({
    message: "Get all orders successfully",
    data: result
  })
}
