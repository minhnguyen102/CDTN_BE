import { Request, Response, NextFunction } from "express"
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({
    err: err.message
  })
}
