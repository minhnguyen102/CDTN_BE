import { ObjectId } from "mongodb"

interface RecommendationType {
  _id?: ObjectId
  dishId: ObjectId
  recommendedDishIds: string[]
  updatedAt: Date
}

export default class Recommendation {
  _id?: ObjectId
  dishId: ObjectId
  recommendedDishIds: ObjectId[]
  updatedAt: Date

  constructor(recomentdation: RecommendationType) {
    this.dishId = new ObjectId(recomentdation.dishId)
    this.recommendedDishIds = recomentdation.recommendedDishIds.map((id: string) => new ObjectId(id))
    this.updatedAt = new Date()
  }
}
