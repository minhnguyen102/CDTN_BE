import { ObjectId } from "mongodb"
import databaseService from "./database.servies"
import { DishStatus } from "../constants/enums"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { config } from "dotenv"
import { reject } from "lodash"
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

    const [cartItems, minimizedMenu] = await Promise.all([
      databaseService.dishes
        .find({ _id: { $in: dishObjectIds } })
        .project({ name: 1 })
        .toArray(),
      databaseService.dishes // Lấy menu rút gọn: Gồm các món ăn ngoại trừ các món có trong cart
        .aggregate([
          {
            $match: {
              _id: { $nin: dishObjectIds },
              status: DishStatus.AVAILABLE
            }
          },
          {
            $sample: { size: 30 }
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
    ])

    const cartNames = cartItems.map((item) => item.name).join(", ")

    const prompt = `
            Giỏ hàng: "${cartNames}".
            Menu: ${JSON.stringify(minimizedMenu)}.
            Chọn 3 món từ Menu hợp nhất để ăn kèm.
            Output JSON: ["id1", "id2", "id3"]
        `
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",

        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.95,
          maxOutputTokens: 100,
          responseMimeType: "application/json"
        }
      })
      const aiCall = model.generateContent(prompt)
      const timeOut = new Promise((_, reject) => setTimeout(() => reject(new Error("TIME OUT")), 2500))

      const result: any = await Promise.race([aiCall, timeOut])
      const cleanText = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
      const recommendedIdsString = JSON.parse(cleanText)
      const recommendedObjectIds = recommendedIdsString.map((id: string) => new ObjectId(id))

      databaseService.recommendations
        .insertOne({
          combinationKey: sortedIds,
          recommendedDishIds: recommendedObjectIds,
          updatedAt: new Date()
        })
        .catch((err) => console.error("Lỗi lưu cache:", err))

      return databaseService.dishes
        .find({ _id: { $in: recommendedObjectIds } })
        .project({ name: 1, price: 1, image: 1, ratingAverage: 1, reviewCount: 1 })
        .toArray()
    } catch (error: any) {
      if (error.message !== "TIMEOUT") console.error("Lỗi AI:", error)
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
