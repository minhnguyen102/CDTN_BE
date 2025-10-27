import { Request, Response, NextFunction } from "express"
import { ValidationChain, validationResult } from "express-validator"
import { RunnableValidationChains } from "express-validator/lib/middlewares/schema"

// can be reused by many routes
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // sequential processing, stops running validations chain if one fails.
    await validation.run(req)
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    return res.status(400).json({ errors: errors.mapped() })
  }
}
