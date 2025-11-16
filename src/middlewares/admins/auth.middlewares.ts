import { Request, Response, NextFunction } from "express"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import USER_MESSAGES from "../../constants/message"

/**
 * Middleware kiểm tra quyền (permission)
 *
 * Đây là một "higher-order function", nó trả về một middleware.
 * Nó phải được dùng SAU KHI 'accessTokenValidation' đã chạy và
 * đã gán payload (đã giải mã) vào 'req.decoded_token'.
 */
export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const decoded_access_token = req.decoded_access_token
    // 2. Kiểm tra xem payload có tồn tại không
    if (!decoded_access_token) {
      // Lỗi này không nên xảy ra nếu 'accessTokenValidation' chạy đúng
      return next(
        new ErrorWithStatus({
          message: USER_MESSAGES.UNAUTHORIZED, // "Token không hợp lệ"
          status: HTTP_STATUS.UNAUTHORIZED // 401
        })
      )
    }

    // 3. Lấy mảng permissions từ payload
    const userPermissions = (decoded_access_token.permissions as string[]) || []

    // 4. Kiểm tra xem user có quyền được yêu cầu hay không
    if (!userPermissions.includes(requiredPermission)) {
      // Nếu không có quyền -> ném lỗi 403 Forbidden
      return next(
        new ErrorWithStatus({
          message: USER_MESSAGES.FORBIDDEN, // "Không có quyền truy cập"
          status: HTTP_STATUS.FORBIDDEN // 403
        })
      )
    }

    // 5. Nếu có quyền -> cho phép đi tiếp
    next()
  }
}
