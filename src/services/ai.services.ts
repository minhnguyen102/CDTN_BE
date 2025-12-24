import { ObjectId } from "mongodb"
import databaseService from "./database.servies"
import { DishStatus } from "../constants/enums"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { config } from "dotenv"
config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

class AIService {
  // Gợi ý món ăn khu vực giỏ hàng
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

  // Gửi báo cáo hàng tuần
  async generateWeeklyReport(data: any) {
    const prompt = `
      Bạn là "Trợ lý Quản lý Nhà hàng" (AI Manager).
      Hãy phân tích dữ liệu kinh doanh tuần qua (${data.range.from} - ${data.range.to}) và viết email báo cáo gửi cho Chủ quán.

      DỮ LIỆU THỐNG KÊ:
      ${JSON.stringify(data)}

      YÊU CẦU OUTPUT (HTML BODY):
      - Trả về mã HTML (không cần thẻ <html>, <head>, chỉ cần nội dung body).
      - Style gọn gàng, dùng các thẻ <h2>, <ul>, <li>, <b>, <p>.
      - Tone giọng: Chuyên nghiệp, khách quan, đóng vai trò người cố vấn.

      CẤU TRÚC BÁO CÁO:
      1. <h2>📊 Tổng quan tài chính</h2>:
         - Báo cáo Doanh thu (${data.summary.totalRevenue}đ) và Số đơn (${data.summary.totalOrders}).
         - Nhận xét ngắn về hiệu suất (Tốt/Trung bình/Cần cải thiện).

      2. <h2>🏆 Hiệu suất Menu</h2>:
         - **Ngôi sao:** Khen ngợi Top 1 bán chạy (${data.performance.bestSellers[0]?.dishName || "N/A"}).
         - **Cảnh báo (Zero Sales):** Phân tích kỹ danh sách 'zeroSales'. Tại sao các món này (đặc biệt món giá cao) lại không bán được? Đặt câu hỏi nghi vấn về giá cả hoặc hiển thị.

      3. <h2>⭐ Trải nghiệm Khách hàng</h2>:
         - Dựa vào Rating (${data.customerFeedback.averageRating}/5).
         - Nếu ít review (< 5): Cảnh báo cần tăng tương tác khách hàng.
         - Nếu Rating thấp (< 4.0): Cảnh báo khẩn cấp về chất lượng.

      4. <h2>💡 Đề xuất tuần tới (Action Items)</h2>:
         - Đưa ra 3 hành động cụ thể. Ví dụ: Chạy khuyến mãi xả hàng cho món Zero Sales, Upsell món kèm theo, v.v.

      Lưu ý: Chỉ phân tích dựa trên số liệu thật. Không bịa đặt.
    `

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.7
        }
      })

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Làm sạch markdown nếu AI trả về dính ```html
      return text.replace(/```html|```/g, "").trim()
    } catch (error) {
      console.error("❌ Lỗi AI Weekly Report:", error)
      return `
        <h2>Báo cáo tuần</h2>
        <p>Hệ thống AI đang bận. Dưới đây là dữ liệu thô:</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `
    }
  }
}

const aiService = new AIService()
export default aiService
