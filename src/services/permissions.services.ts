import databaseService from "./database.servies"
import { ObjectId } from "mongodb"
import { createPermissionReqBody, updatePermissionReqBody } from "../models/requests/Permission.request"
import Permission from "../models/schema/Permission.schema"

class PermissionServices {
  async createPermission({ payload }: { payload: createPermissionReqBody }) {
    const permission = await databaseService.permissions.insertOne(new Permission(payload))
    const { insertedId } = permission
    const result = await databaseService.permissions.findOne(
      { _id: new ObjectId(insertedId) },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0
        }
      }
    )
    return result
  }

  async getAllPermissions(): Promise<Permission[]> {
    const permissions = await databaseService.permissions
      .find({}, { projection: { createdAt: 0, updatedAt: 0 } })
      .sort({ module: 1, name: 1 })
      .toArray()

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
    const result = await databaseService.permissions.findOneAndUpdate(
      { _id: new ObjectId(permission_id) },
      {
        $set: payload,
        $currentDate: { updatedAt: true }
      },
      {
        returnDocument: "after",
        projection: {
          createdAt: 0,
          updatedAt: 0
        }
      }
    )
    return result
  }

  async deletePermission({ permission_id }: { permission_id: string }): Promise<boolean> {
    const objectIdDelete = new ObjectId(permission_id)

    const result = await databaseService.permissions.deleteOne({
      _id: objectIdDelete
    })
    if (result.deletedCount === 0) {
      return false // Trả về false để báo hiệu không tìm thấy
    }

    // Nếu xóa thành công, hãy dọn dẹp nó
    // khỏi tất cả các 'roles' đang tham chiếu đến nó.
    await databaseService.roles.updateMany(
      {
        permissionIds: objectIdDelete // Tìm tất cả role có ID này
      },
      {
        $pull: { permissionIds: objectIdDelete } // Xóa ID đó khỏi mảng
      }
    )
    return true
  }
}

const permissionServices = new PermissionServices()
export default permissionServices
