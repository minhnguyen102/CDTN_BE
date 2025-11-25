import { createCategoryReqBody, updateCategoryReqBody } from "../models/requests/Category.request"
import Category from "../models/schema/Category.schema"
import { CategoryTypeStatus } from "../constants/enums"
import databaseService from "./database.servies"
import { ObjectId } from "mongodb"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import { removeAccents } from "../utils/helpers"

class CategoryServices {
  async getAllCategories({
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
    const objectFind: any = {}
    // FilterStatus
    if (status) {
      const validStatuses = Object.values(CategoryTypeStatus) as string[]
      if (validStatuses.includes(status)) {
        objectFind.status = status as CategoryTypeStatus
      } else {
        throw new ErrorWithStatus({
          message: `Trạng thái filter không hợp lệ`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }
    if (search) {
      objectFind.name_search = { $regex: search, $options: "i" }
    }
    const skip = (page - 1) * limit
    const [categories, totalFilteredDocuments] = await Promise.all([
      databaseService.categories
        .find(objectFind, {
          projection: {
            createdAt: 0,
            updatedAt: 0,
            name_search: 0
          }
        })
        .limit(limit)
        .skip(skip)
        .toArray(),
      databaseService.categories.countDocuments(objectFind)
    ])
    const totalPage = Math.ceil(totalFilteredDocuments / limit)
    return {
      categories,
      pagination: {
        currentPage: page,
        limit: limit,
        total: totalFilteredDocuments,
        totalPage: totalPage
      }
    }
  }

  async createCategory({ payload }: { payload: createCategoryReqBody }) {
    const name_search = removeAccents(payload.name)
    const result = await databaseService.categories.insertOne(new Category({ ...payload, name_search }))
    const { insertedId } = result
    const category = await databaseService.categories.findOne(
      { _id: new ObjectId(insertedId) },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0,
          name_search: 0
        }
      }
    )
    return category
  }

  async updateCategory({ id, payload }: { id: string; payload: updateCategoryReqBody }) {
    const result = await databaseService.categories.findOneAndUpdate(
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
          createdAt: 0,
          updatedAt: 0,
          name_search: 0
        }
      }
    )
    return result
  }
}

const categoryServices = new CategoryServices()
export default categoryServices
