import databaseService from "./database.servies"
import Table from "../models/schema/Table.schema"
import { TableStatus } from "../constants/enums"
import { genQRtable } from "../utils/qr"
import { randomQrToken } from "../utils/crypto"
import { paginationHelper } from "../utils/helpers"
import { table } from "console"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"

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

  async getAllTablesController({ page, status }: { page: number; status?: string }) {
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
      if (isNaN(Number(status)) && status in TableStatus) {
        // nếu truyền là chữ
        // console.log(TableStatus[status as keyof typeof TableStatus]) // return 0
        objectFind.status = TableStatus[status as keyof typeof TableStatus]
      } else if (!isNaN(Number(status)) && TableStatus[Number(status)]) {
        // nếu truyền là số
        objectFind.status = Number(status)
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

        QRcode: qrCodeImage // Thêm thuộc tính mới là ảnh QR
      }
    })

    const tablesWithQR = await Promise.all(qrGenerationPromises)

    return {
      tables: tablesWithQR,
      ...objectPagination
    }
  }
}

const tableServices = new TableServices()

export default tableServices
