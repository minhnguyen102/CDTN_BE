import { validate } from "../../utils/validation"
import { checkSchema, ParamSchema } from "express-validator"
import USER_MESSAGES from "../../constants/message"
import { ErrorWithStatus } from "../../models/Errors"
import HTTP_STATUS from "../../constants/httpStatus"

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
    options: [["active", "inactive"]],
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

const idParamValidation: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.ID_IS_REQUIRED
  },
  isMongoId: {
    errorMessage: new ErrorWithStatus({
      message: USER_MESSAGES.INVALID_MONGODB_ID_FORMAT,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
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
      supplier_id: idParamValidation,
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
    ["body", "params"]
  )
)

export const supplierIdValidation = validate(
  checkSchema(
    {
      supplier_id: idParamValidation
    },
    ["params"]
  )
)
