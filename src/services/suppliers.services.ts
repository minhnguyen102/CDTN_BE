import { createSupplierReqBody, updateSupplierReqBody } from "../models/requests/Supplier.request"
import databaseService from "./database.servies"
import Supplier from "../models/schema/Supplier.schema"
import { ObjectId } from "mongodb"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"

class SupplierServices {
  async getAllSuppliers() {
    // Cần thiết sẽ mở rộng phân trang
    const objectFind = {
      isDeleted: false
    }
    const result = await databaseService.suppliers
      .find(objectFind, {
        projection: {
          createdAt: 0,
          updatedAt: 0,
          isDeleted: 0,
          deletedAt: 0
        }
      })
      .toArray()
    return result
  }

  async createSupplier({ payload }: { payload: createSupplierReqBody }) {
    const supplier = await databaseService.suppliers.insertOne(new Supplier(payload))
    const { insertedId } = supplier
    const result = await databaseService.suppliers.findOne({
      _id: new ObjectId(insertedId)
    })
    return result
  }

  async updateSupplier({ payload, supplier_id }: { payload: updateSupplierReqBody; supplier_id: string }) {
    const result = await databaseService.suppliers.findOneAndUpdate(
      {
        _id: new ObjectId(supplier_id),
        isDeleted: false
      },
      {
        $set: {
          ...payload
        },
        $currentDate: {
          updatedAt: true
        }
      },
      {
        returnDocument: "after",
        projection: {
          updatedAt: 0,
          createdAt: 0,
          isDeleted: 0,
          deletedAt: 0
        }
      }
    )
    if (!result) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.SUPPLIER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return result
  }

  async deleteSupplier({ supplier_id }: { supplier_id: string }): Promise<boolean> {
    const result = await databaseService.suppliers.updateOne(
      {
        _id: new ObjectId(supplier_id),
        isDeleted: false
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      }
    )
    // result.modifiedCount sẽ là 1 nếu tìm thấy và cập nhật thành công
    return result.modifiedCount > 0
  }
}

const supplierServices = new SupplierServices()
export default supplierServices
