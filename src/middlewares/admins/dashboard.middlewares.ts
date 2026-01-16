import { checkSchema } from "express-validator"
import { validate } from "../../utils/validation"

export const dashboardQueryValidation = validate(
  checkSchema({
    type: {
      in: ["query"],
      optional: true,
      isIn: {
        options: [["day", "week", "month", "year", "custom"]],
        errorMessage: "type phải là day, week, month, year hoặc custom"
      }
    },
    specificDate: {
      in: ["query"],
      optional: true,
      isISO8601: {
        errorMessage: "specificDate phải là định dạng ISO8601 (YYYY-MM-DD)"
      },
      custom: {
        options: (value) => {
          if (value) {
            const date = new Date(value)
            if (isNaN(date.getTime())) {
              throw new Error("specificDate không hợp lệ")
            }
          }
          return true
        }
      }
    },
    startDate: {
      in: ["query"],
      optional: true,
      isISO8601: {
        errorMessage: "startDate phải là định dạng ISO8601 (YYYY-MM-DD)"
      },
      custom: {
        options: (value, { req }) => {
          if (req.query?.type === "custom" && !value) {
            throw new Error("startDate là bắt buộc khi type=custom")
          }
          return true
        }
      }
    },
    endDate: {
      in: ["query"],
      optional: true,
      isISO8601: {
        errorMessage: "endDate phải là định dạng ISO8601 (YYYY-MM-DD)"
      },
      custom: {
        options: (value, { req }) => {
          if (req.query?.type === "custom" && !value) {
            throw new Error("endDate là bắt buộc khi type=custom")
          }
          if (value && req.query?.startDate) {
            const start = new Date(req.query.startDate as string)
            const end = new Date(value)
            if (end < start) {
              throw new Error("endDate phải sau startDate")
            }
            const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            if (diffDays > 365) {
              throw new Error("Khoảng thời gian không được vượt quá 365 ngày")
            }
          }
          return true
        }
      }
    },
    startHour: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { min: 0, max: 23 },
        errorMessage: "startHour phải từ 0-23"
      }
    },
    endHour: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { min: 0, max: 23 },
        errorMessage: "endHour phải từ 0-23"
      },
      custom: {
        options: (value, { req }) => {
          if (value && req.query?.startHour) {
            if (parseInt(value) < parseInt(req.query.startHour as string)) {
              throw new Error("endHour phải >= startHour")
            }
          }
          return true
        }
      }
    },
    startDay: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { min: 0, max: 6 },
        errorMessage: "startDay phải từ 0-6 (0=Chủ nhật)"
      }
    },
    endDay: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { min: 0, max: 6 },
        errorMessage: "endDay phải từ 0-6"
      }
    },
    startDayOfMonth: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { min: 1, max: 31 },
        errorMessage: "startDayOfMonth phải từ 1-31"
      }
    },
    endDayOfMonth: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { min: 1, max: 31 },
        errorMessage: "endDayOfMonth phải từ 1-31"
      }
    },
    startMonth: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { min: 1, max: 12 },
        errorMessage: "startMonth phải từ 1-12"
      }
    },
    endMonth: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { min: 1, max: 12 },
        errorMessage: "endMonth phải từ 1-12"
      }
    }
  })
)
