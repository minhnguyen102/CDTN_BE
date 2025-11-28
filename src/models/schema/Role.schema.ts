import { ObjectId } from "mongodb"
import { RoleStatus } from "../../constants/enums"

interface RoleType {
  _id?: ObjectId
  name: string
  description?: string
  status: RoleStatus
  permissionIds: ObjectId[]
  isDeleted?: boolean
  deletedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export default class Role {
  _id?: ObjectId
  name: string
  description: string
  status: RoleStatus
  permissionIds: ObjectId[]
  isDeleted?: boolean
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date

  constructor(role: RoleType) {
    const date = new Date()
    this._id = role._id
    this.name = role.name
    this.description = role.description || "" // Gán mặc định là chuỗi rỗng
    this.status = role.status
    this.permissionIds = role.permissionIds || [] // Gán mặc định là mảng rỗng
    this.isDeleted = role.isDeleted || false // Mặc định là false
    this.deletedAt = role.deletedAt || null // Mặc định là null
    this.createdAt = role.createdAt || date
    this.updatedAt = role.updatedAt || date
  }
}
