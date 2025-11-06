import { validate } from "../../utils/validation"
import HTTP_STATUS from "../../constants/httpStatus"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"

const nameValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.NAME_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 50
    },
    errorMessage: USER_MESSAGES.NAME_LENGTH
  }
}
export const createSupplierValidation = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USER_MESSAGES.SUPPLIER_NAME_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.SUPPLIER_NAME_INVALID
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USER_MESSAGES.NAME_LENGTH
        }
      },
      taxCode: {
        notEmpty: {
          errorMessage: USER_MESSAGES.SUPPLIER_TAX_CODE_REQUIRED
        },
        isAlphanumeric: {
          errorMessage: USER_MESSAGES.SUPPLIER_TAX_CODE_INVALID
        },
        isLength: {
          options: { min: 5, max: 20 },
          errorMessage: USER_MESSAGES.SUPPLIER_TAX_CODE_LENGTH_INVALID
        },
        trim: true
      },
      status: {
        notEmpty: {
          errorMessage: USER_MESSAGES.SUPPLIER_STATUS_REQUIRED
        },
        isIn: {
          options: [["Active", "Inactive"]],
          errorMessage: USER_MESSAGES.SUPPLIER_STATUS_INVALID
        }
      },
      contactPerson: {
        notEmpty: {
          errorMessage: USER_MESSAGES.SUPPLIER_CONTACT_PERSON_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.SUPPLIER_CONTACT_PERSON_INVALID
        },
        trim: true
      },
      phone: {
        notEmpty: {
          errorMessage: USER_MESSAGES.SUPPLIER_PHONE_REQUIRED
        },
        isMobilePhone: {
          options: ["any"],
          errorMessage: USER_MESSAGES.SUPPLIER_PHONE_INVALID
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGES.SUPPLIER_EMAIL_INVALID
        },
        normalizeEmail: true
      },
      address: {
        notEmpty: {
          errorMessage: USER_MESSAGES.SUPPLIER_ADDRESS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.SUPPLIER_ADDRESS_INVALID
        },
        trim: true
      }
    },
    ["body"]
  )
)
