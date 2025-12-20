import { ObjectId } from "mongodb"
import databaseService from "./database.servies"
import { DishStatus } from "../constants/enums"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { config } from "dotenv"
config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

class AIService {
  async getCartRecomendations({ dishIds }: { dishIds: string[] }) {
    // Nếu giỏ hàng chưa có gì => Đề xuất các món nổi bật
    if (!dishIds || dishIds.length === 0) {
      return databaseService.dishes
        .find(
          {
            isFeatured: true
          },
          {
            projection: {
              _id: 1,
              name: 1,
              price: 1,
              image: 1,
              ratingAverage: 1,
              reviewCount: 1
            }
          }
        )
        .limit(3)
        .toArray()
    }
    // Nếu có => tìm kiếm trong collection recomendation (combinationKey)
    const sortedIds = dishIds.sort().join("_")
    const cacheRecomendation = await databaseService.recommendations.findOne({
      combinationKey: sortedIds
    })
    if (cacheRecomendation) {
      return databaseService.dishes
        .find({ _id: { $in: cacheRecomendation.recommendedDishIds } })
        .project({ name: 1, price: 1, image: 1, ratingAverage: 1, reviewCount: 1 }) // Cân nhắc dữ liệu trả về
        .toArray()
    }
    // Nếu không có => Tạo mới bản ghi + hỏi AI
    // Lấy tên món ăn
    const dishObjectIds = dishIds.map((dishId) => new ObjectId(dishId))
    const cartItems = await databaseService.dishes
      .find({ _id: { $in: dishObjectIds } })
      .project({ name: 1 })
      .toArray()
    const cartNames = cartItems.map((item) => item.name).join(", ")

    // Lấy menu rút gọn: Gồm các món ăn ngoại trừ các món có trong cart
    const minimizedMenu = await databaseService.dishes
      .aggregate([
        {
          $match: {
            _id: { $nin: dishObjectIds },
            status: DishStatus.AVAILABLE
          }
        },
        {
          $lookup: {
            from: "dish_categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "dishCategoriesInfo"
          }
        },
        {
          $unwind: {
            path: "$dishCategoriesInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            dishCategoryName: "$dishCategoriesInfo.name"
          }
        }
      ])
      .toArray()
    // console.log(minimizedMenu)

    const prompt = `
            Khách đang có các món này trong giỏ hàng: "${cartNames}".
            Menu quán gồm: ${JSON.stringify(minimizedMenu)}.
            
            Yêu cầu:
            1. Chọn ra 3 món trong Menu bổ sung tốt nhất cho các món trong giỏ (Ví dụ: Giỏ nhiều đồ khô thì gợi ý đồ uống/canh).
            2. Output: CHỈ trả về JSON Array chứa 3 chuỗi _id. Ví dụ: ["id1", "id2"]. Không giải thích.
        `
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",

        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
      const recommendedIdsString = JSON.parse(cleanText)
      const recommendedObjectIds = recommendedIdsString.map((id: string) => new ObjectId(id))

      await databaseService.recommendations.insertOne({
        combinationKey: sortedIds,
        recommendedDishIds: recommendedObjectIds,
        updatedAt: new Date()
      })

      return databaseService.dishes
        .find({ _id: { $in: recommendedObjectIds } })
        .project({ name: 1, price: 1, image: 1, ratingAverage: 1, reviewCount: 1 })
        .toArray()
    } catch (error) {
      console.error("Lỗi AI Cart:", error)
      // Fallback: Trả về 3 món ngẫu nhiên nếu lỗi
      return databaseService.dishes
        .find(
          {
            isFeatured: true
          },
          {
            projection: {
              _id: 1,
              name: 1,
              price: 1,
              image: 1,
              ratingAverage: 1,
              reviewCount: 1
            }
          }
        )
        .limit(5)
        .toArray()
    }
  }
}

const aiService = new AIService()
export default aiService
