import { checkSchema } from "express-validator"
import { validate } from "~/utils/validation"

export const createTableValidation = validate(
  checkSchema(
    {
      number: {
        in: ["body"],
        notEmpty: {
          errorMessage: "Số bàn là bắt buộc."
        },
        isInt: {
          options: { gt: 0 }, // gt: greater than 0
          errorMessage: "Số bàn phải là một số nguyên dương."
        },
        custom: {
          // options: async (value) => {
          //   const existingTable = await Table.findOne({ number: value })
          //   if (existingTable) {
          //     return Promise.reject("Số bàn này đã tồn tại.")
          //   }
          //   return true
          // }
        },
        // Sanitizer
        toInt: true
      },

      // --- 2. Validation cho 'capacity' ---
      capacity: {
        in: ["body"],
        notEmpty: {
          errorMessage: "Sức chứa là bắt buộc."
        },
        isInt: {
          options: { gt: 0 },
          errorMessage: "Sức chứa phải là một số nguyên dương."
        },
        // Sanitizer
        toInt: true
      }
    },
    ["body"]
  )
)
