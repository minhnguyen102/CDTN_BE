import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "../utils/validation" // Middleware check lỗi (wrap validationResult)
import USER_MESSAGES from "../constants/message"

// 1. Định nghĩa các ParamSchema tái sử dụng
const brandNameSchema: ParamSchema = {
  optional: true,
  isString: { errorMessage: USER_MESSAGES.SETTINGS.BRAND_NAME_MUST_BE_STRING },
  trim: true,
  isLength: { options: { min: 1, max: 100 } }
}

const urlSchema = (errorMessage: string): ParamSchema => ({
  optional: true,
  isString: { errorMessage: "URL phải là chuỗi" },
  isURL: { errorMessage },
  trim: true
})

const stringSchema = (errorMessage: string): ParamSchema => ({
  optional: true,
  isString: { errorMessage },
  trim: true
})

const emailSchema: ParamSchema = {
  optional: true,
  isEmail: { errorMessage: USER_MESSAGES.SETTINGS.EMAIL_IS_INVALID },
  trim: true,
  toLowerCase: true // Tự động chuyển thường
}

const socialLinksSchema: ParamSchema = {
  optional: true,
  isArray: { errorMessage: USER_MESSAGES.SETTINGS.SOCIAL_LINKS_MUST_BE_ARRAY }
}

const openingHoursSchema: ParamSchema = {
  optional: true,
  isArray: { errorMessage: USER_MESSAGES.SETTINGS.OPENING_HOURS_MUST_BE_ARRAY }
}

// 2. Tạo Validator tổng hợp
export const updateSettingsValidation = validate(
  checkSchema(
    {
      brandName: brandNameSchema,
      slogan: stringSchema(USER_MESSAGES.SETTINGS.SLOGAN_MUST_BE_STRING),
      description: stringSchema(USER_MESSAGES.SETTINGS.DESCRIPTION_MUST_BE_STRING),
      address: stringSchema(USER_MESSAGES.SETTINGS.ADDRESS_MUST_BE_STRING),
      hotline: stringSchema(USER_MESSAGES.SETTINGS.HOTLINE_MUST_BE_STRING),

      logoUrl: urlSchema(USER_MESSAGES.SETTINGS.LOGO_URL_MUST_BE_VALID),
      favicon: urlSchema(USER_MESSAGES.SETTINGS.FAVICON_MUST_BE_VALID),
      googleMapUrl: urlSchema(USER_MESSAGES.SETTINGS.GOOGLE_MAP_URL_MUST_BE_VALID),

      email: emailSchema,

      // --- Validate Mảng Social Links ---
      socialLinks: socialLinksSchema,
      // Wildcard check: Kiểm tra từng phần tử bên trong mảng socialLinks
      "socialLinks.*.platform": {
        optional: true,
        isIn: {
          options: [["Facebook", "Instagram", "Youtube", "Tiktok", "Zalo"]],
          errorMessage: USER_MESSAGES.SETTINGS.SOCIAL_PLATFORM_INVALID
        }
      },
      "socialLinks.*.url": urlSchema(USER_MESSAGES.SETTINGS.SOCIAL_URL_INVALID),

      // --- Validate Mảng Opening Hours ---
      openingHours: openingHoursSchema,
      "openingHours.*.label": stringSchema(USER_MESSAGES.SETTINGS.OPENING_HOURS_LABEL_MUST_BE_STRING),
      "openingHours.*.time": stringSchema(USER_MESSAGES.SETTINGS.OPENING_HOURS_TIME_MUST_BE_STRING)
    },
    ["body"]
  )
)
