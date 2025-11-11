import databaseService from "./database.servies"
import { ObjectId } from "mongodb"
import { createPermissionReqBody, updatePermissionReqBody } from "../models/requests/Permission.request"
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

  async updatePermission({
    permission_id,
    payload
  }: {
    permission_id: string
    payload: updatePermissionReqBody
  }): Promise<Permission | null> {
    // Validation middleware đã chạy, payload chỉ chứa các trường hợp lệ
    // $set sẽ chỉ cập nhật các trường có trong payload
    const result = await databaseService.permissions.findOneAndUpdate(
      { _id: new ObjectId(permission_id) }, // Điều kiện tìm
      {
        $set: payload, // Dữ liệu cập nhật
        $currentDate: { updatedAt: true } // Tự động cập nhật 'updatedAt'
      },
      {
        returnDocument: "after" // Trả về document *sau* khi đã cập nhật
      }
    )

    // result.value là document đã được cập nhật,
    // hoặc null nếu không tìm thấy document nào để cập nhật
    // return result.value as Permission | null
    return result
  }
}

const permissionServices = new PermissionServices()
export default permissionServices
