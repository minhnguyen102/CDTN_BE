import { createSupplierReqBody, updateSupplierReqBody } from "../models/requests/Supplier.request"
import databaseService from "./database.servies"
import Supplier from "../models/schema/Supplier.schema"
import { ObjectId } from "mongodb"

class SupplierServices {
  async createSupplier({ payload }: { payload: createSupplierReqBody }) {
    const supplier = await databaseService.suppliers.insertOne(new Supplier(payload))
    const { insertedId } = supplier
    const result = await databaseService.suppliers.findOne({
      _id: new ObjectId(insertedId)
    })
    return result
  }

  async updateSupplier({ payload, id }: { payload: updateSupplierReqBody; id: string }) {
    const result = await databaseService.suppliers.findOneAndUpdate(
      {
        _id: new ObjectId(id)
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
        returnDocument: "after"
      }
    )
    return result
  }
}

const supplierServices = new SupplierServices()
export default supplierServices
