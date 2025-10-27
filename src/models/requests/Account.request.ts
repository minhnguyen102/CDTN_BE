import { ObjectId } from "mongodb"
import { RoleAccount } from "~/constants/enums"

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: Date
  role: RoleAccount
  ownerId: ObjectId
}
