import { validate } from "../../utils/validation"
import HTTP_STATUS from "../../constants/httpStatus"
import { check, checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"

const nameValidation: ParamSchema = {
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
}

const taxCodeValidation: ParamSchema = {
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
}

const statusValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.SUPPLIER_STATUS_REQUIRED
  },
  isIn: {
    options: [["Active", "Inactive"]],
    errorMessage: USER_MESSAGES.SUPPLIER_STATUS_INVALID
  }
}

const contactPersonValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.SUPPLIER_CONTACT_PERSON_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.SUPPLIER_CONTACT_PERSON_INVALID
  },
  trim: true
}

const phoneValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.SUPPLIER_PHONE_REQUIRED
  },
  isMobilePhone: {
    options: ["any"],
    errorMessage: USER_MESSAGES.SUPPLIER_PHONE_INVALID
  },
  trim: true
}
const emailValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: USER_MESSAGES.SUPPLIER_EMAIL_INVALID
  },
  normalizeEmail: true
}
const addressValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.SUPPLIER_ADDRESS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.SUPPLIER_ADDRESS_INVALID
  },
  trim: true
}
export const createSupplierValidation = validate(
  checkSchema(
    {
      name: nameValidation,
      taxCode: taxCodeValidation,
      status: statusValidation,
      contactPerson: contactPersonValidation,
      phone: phoneValidation,
      email: emailValidation,
      address: addressValidation
    },
    ["body"]
  )
)

export const updateSupplierValidation = validate(
  checkSchema(
    {
      name: {
        optional: true,
        ...nameValidation,
        notEmpty: false
      },
      taxCode: {
        optional: true,
        ...taxCodeValidation,
        notEmpty: false
      },
      status: {
        optional: true,
        ...statusValidation,
        notEmpty: false
      },
      contactPerson: {
        optional: true,
        ...contactPersonValidation,
        notEmpty: false
      },
      phone: {
        optional: true,
        ...phoneValidation,
        notEmpty: false
      },
      email: {
        optional: true,
        ...emailValidation,
        notEmpty: false
      },
      address: {
        optional: true,
        ...addressValidation,
        notEmpty: false
      }
    },
    ["body"]
  )
)
