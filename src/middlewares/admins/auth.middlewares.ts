import { Request, Response, NextFunction } from "express"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"
import USER_MESSAGES from "../../constants/message"

export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const decoded_access_token = req.decoded_access_token
    if (!decoded_access_token) {
      return next(
        new ErrorWithStatus({
          message: USER_MESSAGES.UNAUTHORIZED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      )
    }

    const userPermissions = decoded_access_token.permissions as string[]

    if (!userPermissions.includes(requiredPermission)) {
      return next(
        new ErrorWithStatus({
          message: USER_MESSAGES.FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN
        })
      )
    }
    next()
  }
}
