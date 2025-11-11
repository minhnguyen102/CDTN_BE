import { ObjectId } from "mongodb"
import { RoleStatus } from "../../constants/enums"

export interface createRoleReqBody {
  name: string
  description?: string
  status: RoleStatus
  permissionIds: string[]
}
