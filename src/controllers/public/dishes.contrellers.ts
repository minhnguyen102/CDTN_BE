import { Request, Response } from "express"
import databaseService from "../../services/database.servies"
import { DishStatus } from "../../constants/enums"

export const getPublicDishesController = async (req: Request, res: Response) => {
  const { isFeatured, limit } = req.query

  const filter: any = {
    isFeatured: true,
    status: DishStatus.AVAILABLE,
    deleted: false
  }

  if (isFeatured === "true") {
    filter.isFeatured = true
  }

  const limitNumber = Number(limit) || 10

  const dishes = await databaseService.dishes
    .find(filter)
    .project({
      name: 1,
      price: 1,
      image: 1,
      description: 1
    })
    .limit(limitNumber)
    .toArray()

  return res.status(200).json({
    message: "Lấy thực đơn thành công",
    data: dishes
  })
}
