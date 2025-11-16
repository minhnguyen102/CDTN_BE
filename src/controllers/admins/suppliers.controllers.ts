import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { createSupplierReqBody, updateSupplierReqBody } from "../../models/requests/Supplier.request"
import supplierServices from "../../services/suppliers.services"
import USER_MESSAGES from "../../constants/message"
import { pick } from "lodash"
import HTTP_STATUS from "../../constants/httpStatus"
import { paginationQueryParser } from "../../utils/helpers"

export const viewAllSupplierController = async (req: Request, res: Response) => {
  // pagination
  const { page, limit } = paginationQueryParser(req, { defaultLimit: 5, allowLimits: [5, 10, 15] })
  // Xử lí status
  const status = (req.query.status as string) || undefined
  // Xử lí search
  const search = (req.query.search as string) || undefined

  const result = await supplierServices.getAllSuppliers({ page, limit, status, search })
  res.json({
    message: USER_MESSAGES.GET_ALL_SUPPLIERS_SUCCESS,
    result
  })
}

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

export const updateSupplierController = async (
  req: Request<ParamsDictionary, any, updateSupplierReqBody>,
  res: Response
) => {
  const payload = pick(req.body, ["name", "taxCode", "status", "contactPerson", "phone", "email", "address"])
  const { supplier_id } = req.params
  const result = await supplierServices.updateSupplier({ payload, supplier_id })
  res.json({
    message: USER_MESSAGES.SUPPLIER_UPDATE_SUCCESS,
    result
  })
}

export const deleteSupplierController = async (req: Request, res: Response) => {
  const { supplier_id } = req.params
  const result = await supplierServices.deleteSupplier({ supplier_id })

  if (!result) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.SUPPLIER_NOT_FOUND
    })
  }

  // Xóa mềm thành công
  return res.json({
    message: USER_MESSAGES.DELETE_SUPPLIER_SUCCESS
  })
}
