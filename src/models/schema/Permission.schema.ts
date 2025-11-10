import { ObjectId } from "mongodb"

interface PermissionType {
  _id?: ObjectId
  name: string
  description?: string
  module?: string
  createdAt?: Date
  updatedAt?: Date
}

export default class Permission {
  _id?: ObjectId
  name: string
  description: string
  module: string
  createdAt: Date
  updatedAt: Date

  constructor(permission: PermissionType) {
    const date = new Date()
    this._id = permission._id
    this.name = permission.name
    this.description = permission.description || "" // Gán mặc định
    this.module = permission.module || "general"
    this.createdAt = permission.createdAt || date
    this.updatedAt = permission.updatedAt || date
  }
}
