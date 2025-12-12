import { ObjectId } from "mongodb"
import databaseService from "./database.servies"
import { ErrorWithStatus } from "../models/Errors"
import USER_MESSAGES from "../constants/message"
import HTTP_STATUS from "../constants/httpStatus"
import Dish from "../models/schema/Dish.schema"
import { CreateDishReqBody, UpdateDishReqBody } from "../models/requests/Dish.request"
import { DishCategoryStatus, DishStatus } from "../constants/enums"
import { removeAccents } from "../utils/helpers"
import { deleteFileFromCloudinary } from "../utils/cloudinary"

interface GetListDishParams {
  page: number
  limit: number
  search?: string
  status?: string
  categoryId?: string
  isFeatured?: boolean
  minPrice?: number
  maxPrice?: number
}

class DishService {
  async create(payload: CreateDishReqBody) {
    const category = await databaseService.dish_categories.findOne({
      _id: new ObjectId(payload.categoryId),
      status: DishCategoryStatus.ACTIVE
    })

    if (!category) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.DISH_CATEGORY_INVALID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const recipeInput = payload.recipe || []

    if (recipeInput.length > 0) {
      const ingredientIds = recipeInput.map((item) => new ObjectId(item.ingredientId))

      const validIngredients = await databaseService.ingredients
        .find({
          _id: { $in: ingredientIds },
          deleted: { $ne: true }
        })
        .toArray()

      if (validIngredients.length !== ingredientIds.length) {
        const validIds = validIngredients.map((i) => i._id.toString())
        const invalidIds = ingredientIds.filter((id) => !validIds.includes(id.toString())) // trả về mảng id không hợp lệ

        throw new ErrorWithStatus({
          message: `One or more ingredients verify failed (Not found or Deleted). IDs: ${invalidIds.join(", ")}`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    const newDish = await databaseService.dishes.insertOne(
      new Dish({
        ...payload,
        status: payload.status as DishStatus,
        name_search: removeAccents(payload.name)
      })
    )

    const { insertedId } = newDish
    const result = await databaseService.dishes.findOne(
      { _id: insertedId },
      {
        projection: {
          name_search: 0,
          image_id: 0,
          deleted: 0,
          deletedAt: 0,
          createdAt: 0,
          updatedAt: 0
        }
      }
    )
    return result
  }

  async getList({ page, limit, search, status, categoryId, isFeatured, minPrice, maxPrice }: GetListDishParams) {
    const activeCategories = await databaseService.dish_categories
      .find(
        { status: DishCategoryStatus.ACTIVE },
        {
          projection: {
            _id: 1
          }
        }
      )
      .toArray()
    const activeCategoryIds = activeCategories.map((c) => c._id)
    const match: any = {
      deleted: { $ne: true }
    }

    if (status) {
      match.status = status
    }

    if (categoryId) {
      const isCategoryActive = activeCategoryIds.some((id) => id.toString() === categoryId)
      // console.log("isCategoryActive: ", isCategoryActive)
      // const isCategoryActive = activeCategoryIds.includes(categoryId)

      if (!isCategoryActive) {
        return {
          dishes: [],
          pagination: { currentPage: page, limit, total: 0, totalPages: 0 }
        }
      }
      // Nếu active thì tìm chính xác theo ID đó
      match.categoryId = new ObjectId(categoryId)
    } else {
      match.categoryId = { $in: activeCategoryIds }
    }

    if (isFeatured !== undefined) {
      match.isFeatured = isFeatured
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      match.price = {}
      if (minPrice !== undefined) match.price.$gte = minPrice // Lớn hơn hoặc bằng
      if (maxPrice !== undefined) match.price.$lte = maxPrice // Nhỏ hơn hoặc bằng
    }

    if (search) {
      match.name_search = { $regex: removeAccents(search), $options: "i" }
    }

    const pipeline: any[] = [
      { $match: match },

      { $sort: { createdAt: -1 } },

      { $skip: (page - 1) * limit },
      { $limit: limit },

      // Join với DishCategory để lấy tên danh mục
      {
        $lookup: {
          from: "dish_categories", // Tên collection trong DB
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDetail"
        }
      },
      {
        $unwind: {
          path: "$categoryDetail",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "ingredients",
          localField: "recipe.ingredientId",
          foreignField: "_id",
          as: "relatedIngredients"
        }
      },
      {
        $addFields: {
          // Lấy tên Category ra ngoài (như cũ)
          categoryName: "$categoryDetail.name",

          // Ghi đè lại mảng recipe cũ bằng mảng mới có thêm tên
          recipe: {
            $map: {
              input: "$recipe", // Duyệt qua từng phần tử của recipe
              as: "item", // Gọi phần tử đó là 'item'
              in: {
                ingredientId: "$$item.ingredientId",
                quantity: "$$item.quantity",

                // Tìm tên nguyên liệu tương ứng trong mảng 'relatedIngredients'
                ingredientName: {
                  $let: {
                    vars: {
                      // Tìm nguyên liệu có _id trùng với ingredientId của item
                      matchedIngredient: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$relatedIngredients",
                              as: "ing",
                              cond: { $eq: ["$$ing._id", "$$item.ingredientId"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    // Trả về tên (nếu tìm thấy)
                    in: "$$matchedIngredient.name"
                  }
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          categoryName: "$categoryDetail.name"
        }
      },
      {
        $project: {
          name_search: 0,
          deleted: 0,
          deletedAt: 0,
          categoryDetail: 0,
          image_id: 0,
          createdAt: 0,
          updatedAt: 0,
          relatedIngredients: 0
        }
      }
    ]

    // Chạy song song Query và Count
    const [dishes, total] = await Promise.all([
      databaseService.dishes.aggregate(pipeline).toArray(),
      databaseService.dishes.countDocuments(match)
    ])

    return {
      dishes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async update({ id, payload }: { id: string; payload: UpdateDishReqBody & { image_id?: string } }) {
    const dishId = new ObjectId(id)
    const dish = await databaseService.dishes.findOne({ _id: dishId })
    if (!dish) {
      throw new ErrorWithStatus({
        message: "Dish not found",
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (payload.image && payload.image_id) {
      if (dish.image_id) {
        await deleteFileFromCloudinary(dish.image_id)
      }
      updateData.image = payload.image
      updateData.image_id = payload.image_id
    }

    if (payload.name) {
      updateData.name = payload.name
      updateData.name_search = removeAccents(payload.name)
    }

    if (payload.categoryId) {
      const categoryId = new ObjectId(payload.categoryId)
      const category = await databaseService.dish_categories.findOne({
        _id: categoryId,
        status: DishCategoryStatus.ACTIVE
      })
      if (!category) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.DISH_CATEGORY_INVALID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      updateData.categoryId = categoryId
    }

    if (payload.recipe) {
      const recipeInput = payload.recipe
      if (recipeInput.length > 0) {
        const ingredientIds = recipeInput.map((item: any) => new ObjectId(String(item.ingredientId)))
        // Validate nguyên liệu có tồn tại và chưa bị xóa
        const count = await databaseService.ingredients.countDocuments({
          _id: { $in: ingredientIds },
          deleted: { $ne: true }
        })
        if (count !== ingredientIds.length) {
          throw new ErrorWithStatus({
            message: "One or more ingredients in recipe are invalid",
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
        // Map lại dữ liệu chuẩn
        updateData.recipe = recipeInput.map((item: any) => ({
          ingredientId: new ObjectId(String(item.ingredientId)),
          quantity: Number(item.quantity)
        }))
      } else {
        updateData.recipe = []
      }
    }

    if (payload.price !== undefined) updateData.price = payload.price
    if (payload.description !== undefined) updateData.description = payload.description
    if (payload.status) updateData.status = payload.status
    if (payload.isFeatured !== undefined) updateData.isFeatured = payload.isFeatured

    await databaseService.dishes.updateOne({ _id: dishId }, { $set: updateData })

    const [updatedDish] = await databaseService.dishes
      .aggregate([
        { $match: { _id: dishId } },
        {
          $lookup: {
            from: "dish_categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "categoryDetail"
          }
        },
        { $unwind: { path: "$categoryDetail", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "ingredients",
            localField: "recipe.ingredientId",
            foreignField: "_id",
            as: "relatedIngredients"
          }
        },
        {
          $addFields: {
            // Lấy tên Category ra ngoài (như cũ)
            categoryName: "$categoryDetail.name",

            // Ghi đè lại mảng recipe cũ bằng mảng mới có thêm tên
            recipe: {
              $map: {
                input: "$recipe", // Duyệt qua từng phần tử của recipe
                as: "item", // Gọi phần tử đó là 'item'
                in: {
                  ingredientId: "$$item.ingredientId",
                  quantity: "$$item.quantity",

                  // Tìm tên nguyên liệu tương ứng trong mảng 'relatedIngredients'
                  ingredientName: {
                    $let: {
                      vars: {
                        // Tìm nguyên liệu có _id trùng với ingredientId của item
                        matchedIngredient: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$relatedIngredients",
                                as: "ing",
                                cond: { $eq: ["$$ing._id", "$$item.ingredientId"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      // Trả về tên (nếu tìm thấy)
                      in: "$$matchedIngredient.name"
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: { categoryName: "$categoryDetail.name" }
        },
        {
          $project: {
            categoryDetail: 0,
            name_search: 0,
            deleted: 0,
            relatedIngredients: 0,
            deletedAt: 0,
            createdAt: 0,
            updatedAt: 0
          }
        }
      ])
      .toArray()

    return updatedDish
  }
}

const dishsService = new DishService()
export default dishsService
