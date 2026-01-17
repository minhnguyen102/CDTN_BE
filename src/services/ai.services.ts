import OpenAI from "openai";

class AIService {
  private client: OpenAI;

  constructor() {
    // Groq API (compatible with OpenAI SDK)
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || "",
      baseURL: "https://api.groq.com/openai/v1"
    });
  }

  async analyzeRestaurantData(data: any) {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(data);

    try {
      const completion = await this.client.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Latest Groq model (280 tokens/sec)
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content || "{}";
      return JSON.parse(content);
    } catch (error) {
      console.error("Groq API Error:", error);
      throw new Error("Failed to analyze data with AI");
    }
  }

  private buildSystemPrompt(): string {
    return `Bạn là chuyên gia phân tích kinh doanh nhà hàng với 10+ năm kinh nghiệm.
Nhiệm vụ: Phân tích dữ liệu và đưa ra insights cho chủ nhà hàng.

QUAN TRỌNG: Trả về ĐÚNG format JSON sau (không thêm markdown, không thêm text khác):
{
  "summary": "Tóm tắt tình hình kinh doanh trong 2-3 câu",
  "strengths": [
    {
      "title": "Tiêu đề điểm mạnh",
      "description": "Mô tả chi tiết",
      "evidence": "Số liệu chứng minh",
      "impact": "Tác động tích cực"
    }
  ],
  "weaknesses": [
    {
      "title": "Tiêu đề điểm yếu",
      "description": "Mô tả vấn đề",
      "evidence": "Số liệu chứng minh",
      "severity": "low hoặc medium hoặc high"
    }
  ],
  "recommendations": [
    {
      "title": "Tiêu đề gợi ý",
      "description": "Mô tả chi tiết",
      "action": "Hành động cụ thể cần làm",
      "expectedImpact": "Kết quả mong đợi",
      "priority": "low hoặc medium hoặc high"
    }
  ]
}

Phong cách:
- Chuyên nghiệp nhưng dễ hiểu
- Cụ thể, có số liệu minh chứng
- Hành động cụ thể, không chung chung
- Tối thiểu 2 strengths, 2 weaknesses, 3 recommendations`;
  }

  private buildUserPrompt(data: any): string {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    return `Phân tích dữ liệu nhà hàng sau và trả về JSON theo format đã cho:

📊 TỔNG QUAN:
- Tổng doanh thu: ${formatCurrency(data.totalRevenue)}
- Tổng đơn hàng: ${data.totalOrders}
- Giá trị đơn trung bình: ${formatCurrency(data.avgOrderValue)}

💰 DOANH THU THEO PHƯƠNG THỨC THANH TOÁN:
${data.revenueByPaymentMethod.data.map((m: any) => 
  `- ${m.method}: ${formatCurrency(m.revenue)} (${m.percentage}%)`
).join('\n')}

🍽️ DOANH THU THEO DANH MỤC MÓN ĂN:
${data.revenueByDishCategory.data.map((c: any) => 
  `- ${c.categoryName}: ${formatCurrency(c.revenue)} (${c.percentage}%)`
).join('\n')}

📉 TOP 5 MÓN BÁN CHẬM:
${data.slowMovingDishes.data.slice(0, 5).map((d: any) => 
  `- ${d.name}: ${d.sales} phần bán, doanh thu ${formatCurrency(d.revenue)}`
).join('\n')}

🪑 TOP 5 BÀN ĐƯỢC SỬ DỤNG NHIỀU NHẤT:
${data.tableUsageFrequency.data.slice(0, 5).map((t: any) => 
  `- Bàn ${t.tableNumber}: ${t.usageCount} lần sử dụng, doanh thu ${formatCurrency(t.totalRevenue)}`
).join('\n')}

👥 KHÁCH HÀNG THEO KHUNG GIỜ:
- Giờ cao điểm: ${data.customersByTimeSlot.insights.peakHours.join(', ')}
- Giờ thấp điểm: ${data.customersByTimeSlot.insights.lowHours.join(', ')}
- Tổng đơn hàng: ${data.customersByTimeSlot.insights.totalOrders}

⏱️ THỜI GIAN PHỤC VỤ:
- Thời gian trung bình: ${data.averageServiceTime.avgServiceTime} phút
- Nhanh nhất: ${data.averageServiceTime.minServiceTime} phút
- Chậm nhất: ${data.averageServiceTime.maxServiceTime} phút

📦 NGUYÊN LIỆU SẮP HẾT:
${data.lowStockIngredients.length > 0 
  ? data.lowStockIngredients.map((i: any) => 
      `- ${i.name}: còn ${i.currentStock}${i.unit} (tối thiểu ${i.minStock}${i.unit})`
    ).join('\n')
  : '- Không có nguyên liệu nào sắp hết'
}

⭐ ĐÁNH GIÁ KHÁCH HÀNG:
- Rating trung bình: ${data.averageRating.toFixed(1)}/5
- Tổng số reviews: ${data.totalReviews}

Hãy phân tích và trả về JSON theo đúng format đã cho.`;
  }
}

export default new AIService();
