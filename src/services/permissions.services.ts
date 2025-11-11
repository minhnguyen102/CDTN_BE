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
    return result
  }

  async deletePermission(permission_id: string): Promise<boolean> {
    const objectIdDelete = new ObjectId(permission_id)
    // 1. Thử xóa permission
    const result = await databaseService.permissions.deleteOne({
      _id: objectIdDelete
    })

    // 2. Kiểm tra xem có xóa được không
    // Nếu result.deletedCount là 0, nghĩa là không tìm thấy
    if (result.deletedCount === 0) {
      return false // Trả về false để báo hiệu không tìm thấy
    }

    // 3. (Quan trọng) Nếu xóa thành công, hãy dọn dẹp nó
    // khỏi tất cả các 'roles' đang tham chiếu đến nó.
    await databaseService.roles.updateMany(
      {
        permissionIds: objectIdDelete // Tìm tất cả role có ID này
      },
      {
        $pull: { permissionIds: objectIdDelete } // Xóa ID đó khỏi mảng
      }
    )
    return true // Trả về true để báo hiệu xóa thành công
  }
}

const permissionServices = new PermissionServices()
export default permissionServices
