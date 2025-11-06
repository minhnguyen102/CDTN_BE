import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { createSupplierReqBody } from "../../models/requests/Supplier.request"
import supplierServices from "../../services/suppliers.services"
import USER_MESSAGES from "../../constants/message"

export const createSupplierController = async (
  req: Request<ParamsDictionary, any, createSupplierReqBody>,
  res: Response
) => {
  const result = await supplierServices.createSupplier({ payload: req.body })
  res.json({
    message: USER_MESSAGES.CREATE_SUPPLIER_SUCCESS,
    result
  })
}
