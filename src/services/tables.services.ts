import databaseService from "./database.servies"
import Table from "../models/schema/Table.schema"
import { TableStatus } from "../constants/enums"
import { genQRtable } from "../utils/qr"
import { randomQrToken } from "../utils/crypto"
import { paginationHelper } from "../utils/helpers"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { ObjectId } from "mongodb"
import { updateTableReqBody } from "../models/requests/Account.request"

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
          status: TableStatus.AVAILABLE
        })
      ),
      await genQRtable({ qrToken })
    ])
    const newTable = await databaseService.tables.findOne({ _id: tanleToInsert.insertedId })
    return {
      QRcode: qrCodeImageString,
      table: newTable
    }
  }

  async getAllTables({ page, status }: { page: number; status?: string }) {
    const objectFind: { status?: TableStatus } = {}

    // Pagination
    const objectPagination: {
      currentPage: number
      skip?: number
      limit: number
      totalPage?: number
    } = {
      currentPage: page,
      limit: 4
    }
    const totalDocument = await databaseService.tables.countDocuments()
    paginationHelper({
      totalDocument,
      objectPagination
    })
    // console.log("newObjectPagination: ", newObjectPagination)
    // console.log("objectPagination: ", objectPagination)

    // FilterStatus
    if (status) {
      const validStatuses = Object.values(TableStatus) as string[]
      if (validStatuses.includes(status)) {
        console.log(TableStatus[status as keyof typeof TableStatus])
        objectFind.status = TableStatus[status as keyof typeof TableStatus]
      } else {
        throw new ErrorWithStatus({
          message: `Trạng thái filter không hợp lệ`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    const tables = await databaseService.tables
      .find(objectFind)
      .limit(objectPagination.limit)
      .skip(objectPagination.skip as number)
      .toArray()

    // Xử lí trả về QRcode cho trang quản lí
    const qrGenerationPromises = tables.map(async (table) => {
      const { qrToken } = table
      const qrCodeImage = await genQRtable({ qrToken })
      return {
        _id: table._id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        qrToken: table.qrToken,
        QRcode: qrCodeImage // Thêm thuộc tính mới là ảnh QR
      }
    })

    const tablesWithQR = await Promise.all(qrGenerationPromises)

    return {
      tables: tablesWithQR,
      ...objectPagination
    }
  }

  async updateTable({ payload, id }: { payload: updateTableReqBody; id: string }) {
    const result = await databaseService.tables.findOneAndUpdate(
      { _id: new ObjectId(id) },
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
          qrToken: 0
        }
      }
    )

    return result
  }

  async regenerateQrToken({ id }: { id: string }) {
    const new_qrToken = randomQrToken()
    const result = await databaseService.tables.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          qrToken: new_qrToken
        },
        $currentDate: {
          updatedAt: true
        }
      },
      {
        returnDocument: "after"
      }
    )
    const qrToken = result?.qrToken as string
    const newQRtable = await genQRtable({ qrToken })
    return {
      qrToken,
      QRtable: newQRtable
    }
  }
}

const tableServices = new TableServices()

export default tableServices
