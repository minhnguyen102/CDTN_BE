import { Request, Response } from "express"
import paymentService from "../../services/payment.services"
import USER_MESSAGES from "../../constants/message"

export const sepayWebhookController = async (req: Request, res: Response) => {
  try {
    // Log ra để debug xem SePay gửi gì về
    console.log("SePay Webhook Data:", JSON.stringify(req.body, null, 2))

    const result = await paymentService.handleSePayWebhook(req.body)

    return res.json(result)
  } catch (error) {
    console.error("SePay Webhook Error:", error)
    // Luôn trả về 200 hoặc 500 để SePay biết
    return res.status(500).json({ error: "Internal Server Error" })
  }
}

export const getPaymentUrlController = async (req: Request, res: Response) => {
  const { orderId } = req.params
  const qrUrl = await paymentService.getPaymentUrl({ orderId })

  return res.json({
    message: USER_MESSAGES.GET_PAYMENT_QR_SUCCESSFULLY,
    result: qrUrl
  })
}
