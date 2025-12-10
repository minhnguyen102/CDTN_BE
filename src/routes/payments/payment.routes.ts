import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { getPaymentUrlController, sepayWebhookController } from "../../controllers/payments/payment.controllers"

const paymentRouter = Router()

/**
 * Path: /payment/sepay-webhook
 * Method: POST
 * Description: Nhận thông báo giao dịch từ SePay
 * Auth: Public (Không cần accessToken vì SePay gọi vào)
 */
paymentRouter.post("/sepay-webhook", wrapHandlerFunction(sepayWebhookController))

/**
 * Path: /payment/qr/:orderId
 * Method: GET
 * Description: Lấy link QR thanh toán mới nhất cho đơn hàng
 */
paymentRouter.get("/qr/:orderId", wrapHandlerFunction(getPaymentUrlController)) // nên validate orderId

export default paymentRouter
