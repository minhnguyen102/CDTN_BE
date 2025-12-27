import databaseService from "./database.servies"
import Table from "../models/schema/Table.schema"
import { BookingStatus, TableStatus } from "../constants/enums"
import { genQRtable } from "../utils/qr"
import { randomQrToken } from "../utils/crypto"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import { ObjectId } from "mongodb"
import { updateTableReqBody } from "../models/requests/Account.request"
import USER_MESSAGES from "../constants/message"
import { parseTimeToMinutes } from "../utils/helpers"

class TableServices {
  async createTable({ capacity }: { capacity: number }) {
    const number = await databaseService.tables.countDocuments()
    const qrToken = randomQrToken()
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
    const newTable = await databaseService.tables.findOne(
      { _id: tanleToInsert.insertedId },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0
        }
      }
    )
    return {
      QRcode: qrCodeImageString,
      table: newTable
    }
  }

  async getAllTables({
    page,
    status,
    limit,
    search,
    capacity
  }: {
    page: number
    status?: string
    limit: number
    search?: number
    capacity?: number
  }) {
    const objectFind: { status?: TableStatus; number?: number; capacity?: number | { $gte: number } } = {}
    // Lọc trước rồi mới tìm kiếm và phân trang trên kết quả lọc trả về
    // FilterStatus
    if (status) {
      const validStatuses = Object.values(TableStatus) as string[]
      if (validStatuses.includes(status)) {
        objectFind.status = status as TableStatus
      } else {
        throw new ErrorWithStatus({
          message: `Trạng thái filter không hợp lệ`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }
    // Search
    if (search) {
      objectFind.number = search
    }
    // Capacity
    if (capacity) {
      objectFind.capacity = { $gte: capacity }
    }
    // Tính toán skip
    const skip = (page - 1) * limit

    const [tables, totalFilteredDocuments] = await Promise.all([
      databaseService.tables.find(objectFind).limit(limit).skip(skip).toArray(),
      databaseService.tables.countDocuments(objectFind)
    ])

    // Tính toán totalPage (dựa trên tổng đã lọc)
    const totalPage = Math.ceil(totalFilteredDocuments / limit)

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
        currentOrderId: table.currentOrderId,
        QRcode: qrCodeImage // Thêm thuộc tính mới là ảnh QR
      }
    })

    const tablesWithQR = await Promise.all(qrGenerationPromises)

    return {
      tables: tablesWithQR,
      pagination: {
        currentPage: page,
        limit: limit,
        total: totalFilteredDocuments, // Tổng số item (đã lọc)
        totalPage: totalPage // Tổng số trang (đã lọc)
      }
    }
  }

  async updateTable({ payload, id }: { payload: updateTableReqBody; id: string }) {
    const { status } = payload

    const table = (await databaseService.tables.findOne({
      _id: new ObjectId(id)
    })) as Table
    if (status === TableStatus.AVAILABLE && table.currentOrderId) {
      throw new ErrorWithStatus({
        message: "Bàn đang phục vụ, không được chuyển trạng thái về đang trống",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
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

  async getAvailableTables({ bookingId }: { bookingId: string }) {
    const MEAL_DURATION = 120 // 2 tiếng: fix cứng cho một bữa ăn
    const booking = await databaseService.bookings.findOne({
      _id: new ObjectId(bookingId)
    })
    if (!booking) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.BOOKING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const { guestNumber, bookingDate, bookingTime } = booking
    const requestTimeMinutes = parseTimeToMinutes(bookingTime)
    // Xác định khung giờ trong ngày hôm đó
    const startOffDay = new Date(bookingDate)
    startOffDay.setHours(0, 0, 0, 0)
    const endOffDay = new Date(bookingDate)
    endOffDay.setHours(23, 59, 59, 99)

    // Tìm ra các bàn đã bị đặt
    const conflictBookings = await databaseService.bookings
      .find({
        bookingDate: { $gte: startOffDay, $lte: endOffDay },
        _id: { $ne: new ObjectId(bookingId) },
        status: { $nin: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        tableId: { $ne: null as any }
      })
      .toArray() // lấy ra danh sách các booking trong ngày hôm đó (trong trạng thái chờ, xác nhận hoặc đã xử lí)

    const busyTableIds: ObjectId[] = []
    for (const item of conflictBookings) {
      const existingTimeMinutes = parseTimeToMinutes(item.bookingTime)
      if (Math.abs(existingTimeMinutes - requestTimeMinutes) < MEAL_DURATION) {
        if (item.tableId) busyTableIds.push(item.tableId)
      }
    }

    // Tìm ra danh sách bàn hợp lí
    const availableTables = await databaseService.tables
      .find(
        {
          capacity: { $gte: guestNumber },
          _id: { $nin: busyTableIds }
        },
        {
          projection: {
            number: 1,
            capacity: 1
          }
        }
      )
      .sort({ capacity: 1 })
      .toArray()
    return availableTables
  }
}

const tableServices = new TableServices()

export default tableServices
