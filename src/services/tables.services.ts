import databaseService from "./database.servies"
import Table from "../models/schema/Table.schema"
import { TableStatus } from "../constants/enums"
import { genQRtable } from "../utils/qr"
import { randomQrToken } from "../utils/crypto"
import { paginationHelper } from "../utils/helpers"
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

  async getAllTablesController({ page }: { page: number }) {
    const objectPagination: {
      currentPage: number
      skip?: number
      limit: number
      totalPage?: number
    } = {
      currentPage: page,
      limit: 2
    }
    const totalDocument = await databaseService.tables.countDocuments()
    const newObjectPagination = paginationHelper({
      totalDocument,
      objectPagination
    })
    // console.log("newObjectPagination: ", newObjectPagination)
    // console.log("objectPagination: ", objectPagination)
    const tables = await databaseService.tables
      .find()
      .limit(objectPagination.limit)
      .skip(objectPagination.skip as number)
      .toArray()

    const qrGenerationPromises = tables.map(async (table) => {
      // a. Tạo link URL từ qrToken (token bí mật)
      const qrToken = table.qrToken

      // b. Tạo ảnh QR (dạng Data URL)
      const qrCodeImage = await genQRtable({ qrToken })

      // c. Trả về một OBJECT MỚI.
      //    **QUAN TRỌNG**: Không được trả về qrToken (chuỗi bí mật) cho client!
      return {
        _id: table._id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        // (Thêm các trường khác bạn cần hiển thị...)

        QRcode: qrCodeImage // Thêm thuộc tính mới là ảnh QR
      }
    })

    // 3. Đợi TẤT CẢ các "lời hứa" (hàm tạo QR) chạy xong
    const tablesWithQR = await Promise.all(qrGenerationPromises)
    // console.log(tablesWithQR)
    return {
      tables: tablesWithQR,
      ...objectPagination
    }
  }
}

const tableServices = new TableServices()

export default tableServices
