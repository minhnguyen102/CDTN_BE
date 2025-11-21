import databaseService from "./database.servies"
import { ObjectId } from "mongodb"
import { CreateDishCategoryReqBody, UpdateDishCategoryReqBody } from "../models/requests/DishCategory.requests"
import DishCategory from "../models/schema/DishCategory.schema"
import { deleteImage } from "../utils/cloudinary"

class DishCategoryService {
  async create({ payload }: { payload: CreateDishCategoryReqBody & { image: string; image_id: string } }) {
    const newCategory = await databaseService.dish_categories.insertOne(new DishCategory(payload))
    const result = await databaseService.dish_categories.findOne(
      {
        _id: newCategory.insertedId
      },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0
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
      // active or inactive
      matchFilter.status = status
    }

    if (search) {
      // search theo name
      matchFilter.$text = { $search: search }
    }

    const pipeline: any[] = [
      { $match: matchFilter },
      {
        $sort: {
          displayOrder: 1 // theo thứ tự ưu tiên
        }
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          createdAt: 0,
          updatedAt: 0,
          deletedAt: 0,
          deleted: false
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

  async update({ id, payload }: { id: string; payload: UpdateDishCategoryReqBody }) {
    // update image (xóa cũ, thêm mới)
    // const dish_catefory = await databaseService.dish_categories.findOne({
    //   _id: new ObjectId(id)
    // })
    // const publicId =
    // if (payload.image) {
    //   deleteImage()
    // }
    // update các trường (-image)
  }
}

const dishCategoryService = new DishCategoryService()
export default dishCategoryService
