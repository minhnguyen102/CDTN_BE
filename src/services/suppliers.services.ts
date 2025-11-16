import { createSupplierReqBody, updateSupplierReqBody } from "../models/requests/Supplier.request"
import databaseService from "./database.servies"
import Supplier from "../models/schema/Supplier.schema"
import { ObjectId } from "mongodb"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { SupplierStatus } from "../constants/enums"

class SupplierServices {
  async getAllSuppliers({
    page,
    limit,
    status,
    search
  }: {
    page: number
    limit: number
    status?: string
    search?: string
  }) {
    const objectFind: any = {
      isDeleted: false
    }
    // FilterStatus
    if (status) {
      const validStatuses = Object.values(SupplierStatus) as string[]
      if (validStatuses.includes(status)) {
        objectFind.status = status as SupplierStatus
      } else {
        throw new ErrorWithStatus({
          message: `Trạng thái filter không hợp lệ`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }
    if (search) {
      // const searchRegex = { $regex: search, $options: "i" } // 'i' = không phân biệt hoa thường
      // console.log(searchRegex)
      // objectFind.$or = [
      //   { name: searchRegex },
      //   { phone: searchRegex },
      //   { email: searchRegex },
      //   { contactPerson: searchRegex }
      // ]
      // console.log(search)
      objectFind.$text = { $search: search }
    }

    const skip = (page - 1) * limit

    const [suppliers, totalFilteredDocuments] = await Promise.all([
      databaseService.suppliers
        .find(objectFind, {
          projection: {
            createdAt: 0,
            updatedAt: 0,
            isDeleted: 0,
            deletedAt: 0
          }
        })
        .limit(limit)
        .skip(skip)
        .toArray(),
      databaseService.suppliers.countDocuments(objectFind)
    ])
    // Tính toán totalPage (dựa trên tổng đã lọc)
    const totalPage = Math.ceil(totalFilteredDocuments / limit)

    return {
      suppliers,
      pagination: {
        currentPage: page,
        limit: limit,
        total: totalFilteredDocuments, // Tổng số item (đã lọc)
        totalPage: totalPage // Tổng số trang (đã lọc)
      }
    }
  }

  async createSupplier({ payload }: { payload: createSupplierReqBody }) {
    const supplier = await databaseService.suppliers.insertOne(new Supplier(payload))
    const { insertedId } = supplier
    const result = await databaseService.suppliers.findOne(
      {
        _id: new ObjectId(insertedId)
      },
      {
        projection: {
          updatedAt: 0,
          createdAt: 0,
          isDeleted: 0,
          deletedAt: 0
        }
      }
    )
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
