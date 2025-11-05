import databaseService from "./database.servies"
import Table from "../models/schema/Table.schema"
import { randomBytes } from "crypto"
import { TableStatus } from "../constants/enums"
import { genQRtable } from "../utils/qr"
import { randomQrToken } from "../utils/crypto"
import { table } from "console"

class TableServices {
  async createTable({ capacity }: { capacity: number }) {
    const number = await databaseService.tables.countDocuments()
    const qrToken = randomQrToken()
    // console.log("qrToken", qrToken)
    const [tanleToInsert, qrCodeImageString] = await Promise.all([
      await databaseService.tables.insertOne(
        new Table({
          number: number + 1,
          capacity: capacity,
          qrToken: qrToken,
          status: TableStatus.Available
        })
      ),
      await genQRtable({ qrToken })
    ])
    const newTable = await databaseService.tables.findOne(
      {
        _id: tanleToInsert.insertedId
      },
      {
        projection: {
          qrToken: 0
        }
      }
    )
    return {
      QRcode: qrCodeImageString,
      table: newTable
    }
  }

  async viewTableController() {
    const tables = await databaseService.tables
      .find(
        {},
        {
          projection: {
            qrToken: 0
          }
        }
      )
      .toArray()
    return tables
  }
}

const tableServices = new TableServices()

export default tableServices
