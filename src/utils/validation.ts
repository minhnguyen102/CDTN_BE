import { Request, Response, NextFunction } from "express"
import { ValidationChain, validationResult } from "express-validator"
import { RunnableValidationChains } from "express-validator/lib/middlewares/schema"
import HTTP_STATUS from "../constants/httpStatus"
import { EntityError, ErrorWithStatus } from "../models/Errors"
import { deleteFileFromCloudinary } from "./cloudinary"

// can be reused by many routes
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    const entityErrors = new EntityError({ errors: {} })

    // Nếu không có lỗi
    if (errors.isEmpty()) {
      return next()
    }
    if (req.file) {
      // Với multer-storage-cloudinary, req.file.filename thường là public_id
      await deleteFileFromCloudinary(req.file.filename)
    }
    console.log("Loi ", errors.mapped())

    const errorsObject = errors.mapped()
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      // Nếu lỗi không thuộc nhóm lỗi 422(Liên quan đến điền form sai)
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(new ErrorWithStatus(msg))
      }
      // Nếu là nhóm lỗi 422
      entityErrors.errors[key] = errorsObject[key]
    }
    next(entityErrors)
  }
}
