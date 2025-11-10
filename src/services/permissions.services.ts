import databaseService from "./database.servies"
import { ObjectId } from "mongodb"
import { createPermissionReqBody } from "../models/requests/Permission.request"
import Permission from "../models/schema/Permission.schema"

class PermissionServices {
  async createPermission({ payload }: { payload: createPermissionReqBody }) {
    const permission = await databaseService.permissions.insertOne(new Permission(payload))
    const { insertedId } = permission
    const result = await databaseService.permissions.findOne({ _id: new ObjectId(insertedId) })
    return result
  }

  async getAllPermissions(): Promise<Permission[]> {
    // Lấy tất cả và sắp xếp theo 'module' rồi đến 'name' cho dễ nhìn
    const permissions = await databaseService.permissions.find().sort({ module: 1, name: 1 }).toArray()

    // Trả về mảng các permission
    return permissions as Permission[]
  }
}

const permissionServices = new PermissionServices()
export default permissionServices
