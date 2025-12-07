// import { Request, Response, NextFunction } from "express"
// import { verifyToken } from "../../utils/jwt"
// import { ErrorWithStatus } from "../../models/Errors"
// import HTTP_STATUS from "../../constants/httpStatus"
// import { JsonWebTokenError } from "jsonwebtoken"
// import _ from "lodash"

// export const guestAccessTokenValidator = async (req: Request, res: Response, next: NextFunction) => {
//   // Lấy header Authorization
//   const bearer = req.headers.authorization
//   if (!bearer) {
//     return next(
//       new ErrorWithStatus({
//         message: "Access Token is required",
//         status: HTTP_STATUS.UNAUTHORIZED
//       })
//     )
//   }

//   const token = bearer.split(" ")[1]

//   try {
//     const decoded = await verifyToken({
//       token,
//       secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
//     })

//     // Kiểm tra role phải là Guest
//     if (decoded.role !== "Guest") {
//       throw new ErrorWithStatus({
//         message: "You are not authorized (Guest role required)",
//         status: HTTP_STATUS.FORBIDDEN
//       })
//     }

//     // Gán thông tin đã decode vào Request để Controller sau dùng
//     // (Bạn cần khai báo thêm type cho req.decoded_guest trong file type.d.ts)
//     ;(req as any).decoded_guest = {
//       tableId: decoded.userId,
//       tableNumber: decoded.tableNumber,
//       guestName: decoded.guestName
//     }

//     next()
//   } catch (error) {
//     if (error instanceof JsonWebTokenError) {
//       return next(
//         new ErrorWithStatus({
//           message: _.capitalize(error.message),
//           status: HTTP_STATUS.UNAUTHORIZED
//         })
//       )
//     }
//     next(error)
//   }
// }

// // Sử dụng về sau
