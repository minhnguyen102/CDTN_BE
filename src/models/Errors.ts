import HTTP_STATUS from "~/constants/httpStatus"
import USER_MESSAGES from "~/constants/message"

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
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
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
