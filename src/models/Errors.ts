import HTTP_STATUS from "../constants/httpStatus"
import USER_MESSAGES from "../constants/message"

type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>
export class ErrorWithStatus {
  message: string
  status: number
  code?: string
  constructor({ message, status, code }: { message: string; status: number; code?: string }) {
    this.message = message
    this.status = status
    this.code = code
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  constructor({
    message = USER_MESSAGES.VALIDATION_ERROR,
    status = HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors
  }: {
    message?: string
    status?: number
    errors: ErrorsType
  }) {
    super({ message, status })
    this.errors = errors
  }
}
