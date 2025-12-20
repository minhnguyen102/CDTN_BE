import { ObjectId } from "mongodb"

interface RecommendationType {
  _id?: ObjectId
  combinationKey?: string
  recommendedDishIds: string[]
  updatedAt: Date
}

export default class Recommendation {
  _id?: ObjectId
  combinationKey: string
  recommendedDishIds: ObjectId[]
  updatedAt: Date

  constructor(recomentdation: RecommendationType) {
    this._id = recomentdation._id
    this.combinationKey = recomentdation.combinationKey || ""
    this.recommendedDishIds = recomentdation.recommendedDishIds.map((id: string) => new ObjectId(id))
    this.updatedAt = new Date()
  }
}
