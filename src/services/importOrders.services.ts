import { ObjectId } from "mongodb"
import { CreateImportOrderReqBody } from "../models/requests/ImportOrder.request"
import databaseService from "./database.servies"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { ImportOrderStatus, SupplierStatus } from "../constants/enums"
import ImportOrder from "../models/schema/ImportOrder.schema"

interface GetImportOrdersParams {
  page: number
  limit: number
  search?: string
  status?: string
  supplierId?: string
  dateFrom?: string
  dateTo?: string
}

class ImportOrderService {
  private generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `PO-${date}-${random}`
  }
  // --- Helper: Cập nhật kho hàng loạt (Bulk Write) ---
  private async updateInventory(items: any[]) {
    // Tạo danh sách các thao tác update
    const operations = items.map((item) => ({
      updateOne: {
        filter: { _id: item.ingredientId },
        update: {
          $inc: { currentStock: item.quantity }, // Cộng dồn số lượng tồn kho
          $set: { unitPrice: item.importPrice } // Cập nhật giá nhập mới nhất làm giá tham khảo
        }
      }
    }))

    // Thực thi update hàng loạt (Hiệu năng cao hơn loop từng cái)
    if (operations.length > 0) {
      await databaseService.ingredients.bulkWrite(operations)
    }
  }

  async create({ payload, user_id }: { payload: CreateImportOrderReqBody; user_id: string }) {
    const { items, supplierId, importDate, taxRate = 0, notes, status } = payload

    //check supplierID
    const supplier = await databaseService.suppliers.findOne({
      _id: new ObjectId(supplierId),
      isDeleted: false,
      status: SupplierStatus.ACTIVE
    })
    if (!supplier) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.SUPPLIER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Lấy danh sách ID của các nguyên liệu trong payload
    const ingredientIds = items.map((item) => new ObjectId(item.ingredientId))

    // Tìm thông tin nguyên liệu từ DB (để lấy tên & check tồn tại)
    const ingredients = await databaseService.ingredients
      .find(
        { _id: { $in: ingredientIds } },
        {
          projection: {
            createdAt: 0,
            updatedAt: 0,
            name_search: 0
          }
        }
      )
      .toArray()
    // console.log("ingredients: ", ingredients)
    if (ingredients.length !== items.length) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ITEM_INGREDIENT_ID_INVALID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Tạo Map để truy xuất nhanh thông tin ingredient theo ID
    const ingredientMap = new Map(ingredients.map((ing) => [ing._id.toString(), ing]))
    // console.log("ingredientMap: ", ingredientMap)

    // Tính toán chi tiết cho từng Item (Total) và Subtotal
    let subtotal = 0
    const processedItems = items.map((item) => {
      const ingredient = ingredientMap.get(item.ingredientId)
      if (!ingredient) throw new Error("Unexpected Error: Ingredient not found in map")

      const itemTotal = item.quantity * item.importPrice
      subtotal += itemTotal

      return {
        ingredientId: new ObjectId(item.ingredientId),
        // Quan trọng: Snapshot tên nguyên liệu tại thời điểm nhập
        ingredientName: ingredient.name,
        quantity: item.quantity,
        importPrice: item.importPrice,
        total: itemTotal
      }
    })

    // Tính toán tổng tiền (Grand Total)
    const taxAmount = (subtotal * taxRate) / 100
    const totalAmount = subtotal + taxAmount

    //Lưu phiếu nhập vào DB
    const newImportOrder = await databaseService.import_orders.insertOne(
      new ImportOrder({
        orderNumber: this.generateOrderNumber(), // Hàm helper tự viết
        supplierId: new ObjectId(supplierId),
        importedById: new ObjectId(user_id),
        importDate: new Date(importDate),
        status: status as ImportOrderStatus,
        items: processedItems,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        notes: notes
      })
    )

    //Nếu trạng thái là 'Confirmed' -> Cập nhật kho
    if (status === ImportOrderStatus.CONFIRMED) {
      await this.updateInventory(processedItems)
    }

    return newImportOrder
  }

  async getList({ page, limit, search, status, supplierId, dateFrom, dateTo }: GetImportOrdersParams) {
    const objectFind: any = {}

    // Lọc
    if (status) {
      const validStatus = Object.values(ImportOrderStatus) as string[]
      if (validStatus.includes(status)) {
        objectFind.status = status
      } else {
        throw new ErrorWithStatus({
          message: `Trạng thái filter không hợp lệ`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }
    if (supplierId) objectFind.supplierId = new ObjectId(supplierId) // ngay cả khi bị xóa hay inactive thì vẫn phải lấy ra
    if (search) {
      objectFind.orderNumber = { $regex: search, $options: "i" }
    }
    if (dateFrom || dateTo) {
      objectFind.importDate = {}
      if (dateFrom) objectFind.importDate.$gte = new Date(dateFrom)
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        objectFind.importDate.$lte = toDate
      }
    }

    const pipeline = [
      { $match: objectFind },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplierDetail"
        }
      },
      { $unwind: { path: "$supplierDetail", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "accounts",
          localField: "importedById",
          foreignField: "_id",
          as: "staffDetail"
        }
      },
      { $unwind: { path: "$staffDetail", preserveNullAndEmptyArrays: true } },
      { $unwind: "$items" }, // tách mảng items ra từng document riêng lẻ
      {
        $lookup: {
          from: "ingredients",
          localField: "items.ingredientId",
          foreignField: "_id",
          as: "ingredientInfo"
        }
      },
      { $unwind: { path: "$ingredientInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "items.ingredientName": "$ingredientInfo.name"
        }
      },
      {
        $group: {
          _id: "$_id",
          orderNumber: { $first: "$orderNumber" },
          importDate: { $first: "$importDate" },
          status: { $first: "$status" },
          subtotal: { $first: "$subtotal" },
          taxRate: { $first: "$taxRate" },
          taxAmount: { $first: "$taxAmount" },
          totalAmount: { $first: "$totalAmount" },
          supplierName: { $first: "$supplierDetail.name" },
          importedByName: { $first: "$staffDetail.name" },
          createdAt: { $first: "$createdAt" }, // Cần lấy createdAt để sort lại nếu muốn chính xác
          items: { $push: "$items" } // Gom lại mảng items đã có thêm ingredientName
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          orderNumber: 1,
          importDate: 1,
          status: 1,
          subtotal: 1,
          taxRate: 1,
          taxAmount: 1,
          totalAmount: 1,
          items: 1,
          supplierName: 1,
          importedByName: 1
        }
      }
    ]

    const [importOrders, totalFilteredDocuments] = await Promise.all([
      databaseService.import_orders.aggregate(pipeline).toArray(),
      databaseService.import_orders.countDocuments(objectFind)
    ])

    const totalPages = Math.ceil(totalFilteredDocuments / limit)

    return {
      importOrders,
      pagination: {
        currentPage: page,
        limit,
        total: totalFilteredDocuments,
        totalPages
      }
    }
  }

  async getDetail({ id }: { id: string }) {
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplierDetail"
        }
      },
      { $unwind: { path: "$supplierDetail", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "accounts",
          localField: "importedById",
          foreignField: "_id",
          as: "staffDetail"
        }
      },
      { $unwind: { path: "$staffDetail", preserveNullAndEmptyArrays: true } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "ingredients",
          localField: "items.ingredientId",
          foreignField: "_id",
          as: "ingredientInfo"
        }
      },
      { $unwind: { path: "$ingredientInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "items.unit": "$ingredientInfo.unit"
        }
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          items: { $push: "$items" }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", { items: "$items" }]
          }
        }
      },
      {
        $project: {
          _id: 1,
          importedByName: "$staffDetail.name",
          supplierName: "$supplierDetail.name",

          orderNumber: 1,
          importDate: 1,
          status: 1,
          notes: 1,

          subtotal: 1,
          taxRate: 1,
          taxAmount: 1,
          totalAmount: 1,
          items: 1
        }
      }
    ]

    const [importOrder] = await databaseService.import_orders.aggregate(pipeline).toArray()

    if (!importOrder) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.IMPORT_ORDER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return importOrder
  }

  async changeStatus({ id, newStatus }: { id: string; newStatus: ImportOrderStatus }) {
    const orderId = new ObjectId(id)

    const order = await databaseService.import_orders.findOne({ _id: orderId })

    if (!order) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.IMPORT_ORDER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Nếu đơn hàng ĐÃ Confirmed rồi -> Báo lỗi ngay (Không cho làm lại, không cho quay về Draft)
    if (order.status === ImportOrderStatus.CONFIRMED) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.IMPORT_ORDER_ALREADY_CONFIRMED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Nếu đơn hàng không phải Draft (ví dụ Cancelled) -> Cũng chặn
    if (order.status !== ImportOrderStatus.DRAFT) {
      throw new ErrorWithStatus({
        message: "Only Draft orders can be confirmed",
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // 3. Thực hiện Update trạng thái trong DB
    const updatedOrder = await databaseService.import_orders.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          status: newStatus, // 'confirmed'
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    )

    if (newStatus === ImportOrderStatus.CONFIRMED) {
      await this.updateInventory(order.items)
    }

    return updatedOrder
  }
}

const importOderService = new ImportOrderService()
export default importOderService
