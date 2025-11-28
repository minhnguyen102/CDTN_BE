import databaseService from "./database.servies"
import { ObjectId } from "mongodb"
import { CreateDishCategoryReqBody, UpdateDishCategoryReqBody } from "../models/requests/DishCategory.requests"
import DishCategory from "../models/schema/DishCategory.schema"
import { deleteImage } from "../utils/cloudinary"
import { ErrorWithStatus } from "../models/Errors"
import HTTP_STATUS from "../constants/httpStatus"
import USER_MESSAGES from "../constants/message"
import { removeAccents } from "../utils/helpers"

class DishCategoryService {
  async create({ payload }: { payload: CreateDishCategoryReqBody & { image: string; image_id: string } }) {
    const key_search = removeAccents(payload.name + " " + payload.description || "")
    const newCategory = await databaseService.dish_categories.insertOne(new DishCategory({ ...payload, key_search }))
    const result = await databaseService.dish_categories.findOne(
      {
        _id: newCategory.insertedId
      },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0,
          deleted: 0,
          deletedAt: 0,
          image_id: 0,
          key_search: 0
        }
      }
    )
    return result
  }

  async getList({ page, limit, search, status }: { page: number; limit: number; search?: string; status?: string }) {
    const matchFilter: any = {
      deleted: false
    }

    if (status) {
      matchFilter.status = status
    }

    if (search) {
      // search theo name || des
      matchFilter.key_search = { $regex: removeAccents(search), $options: "i" }
    }

    const pipeline: any[] = [
      { $match: matchFilter },
      {
        $sort: {
          displayOrder: 1, // theo thứ tự ưu tiên,
          name: 1
        }
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          createdAt: 0,
          updatedAt: 0,
          deletedAt: 0,
          deleted: 0,
          image_id: 0,
          key_search: 0
        }
      }
    ]

    const [dishCategories, totalFilteredDocuments] = await Promise.all([
      databaseService.dish_categories.aggregate(pipeline).toArray(),
      databaseService.dish_categories.countDocuments(matchFilter)
    ])

    const totalPages = Math.ceil(totalFilteredDocuments / limit)

    return {
      dishCategories,
      pagination: {
        currentPage: page,
        limit: limit,
        total: totalFilteredDocuments,
        totalPages: totalPages
      }
    }
  }

  async update({
    id,
    payload
  }: {
    id: string
    payload: UpdateDishCategoryReqBody & { image_id?: string; key_search: string }
  }) {
    // update image (xóa cũ, thêm mới)
    const dish_category = await databaseService.dish_categories.findOne({
      _id: new ObjectId(id)
    })
    if (!dish_category) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    if (payload.image) {
      const old_image_id = dish_category?.image_id as string
      await deleteImage(old_image_id)
    }

    if (payload.name || payload.description) {
      if (payload.description) {
        payload.key_search = removeAccents(dish_category.name + " " + payload.description)
      } else {
        payload.name = removeAccents(payload.name + " " + dish_category.description)
      }
    }

    const updateDishCategory = await databaseService.dish_categories.findOneAndUpdate(
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
        returnDocument: "after",
        projection: {
          createdAt: 0,
          updatedAt: 0,
          deletedAt: 0,
          deleted: 0,
          image_id: 0,
          key_search: 0
        }
      }
    )
    return updateDishCategory
  }
}

const dishCategoryService = new DishCategoryService()
export default dishCategoryService
