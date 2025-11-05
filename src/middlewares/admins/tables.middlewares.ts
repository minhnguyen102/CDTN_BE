import { checkSchema } from "express-validator"
import { validate } from "../../utils/validation"

export const createTableValidation = validate(
  checkSchema(
    {
      // capacity: {
      //   notEmpty: {
      //     errorMessage: "Số ghế là bắt buộc"
      //   },
      //   isInt: {
      //     options: { gt: 0 },
      //     errorMessage: "số ghế phải là một số nguyên dương."
      //   },
      //   // Sanitizer
      //   toInt: true
      // }
    },
    ["body"]
  )
)
