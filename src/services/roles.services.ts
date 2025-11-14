import { createRoleReqBody, updateRoleReqBody } from "../models/requests/Role.request"
import Role from "../models/schema/Role.schema"
import { RoleStatus } from "../constants/enums"
import databaseService from "./database.servies"
import { ObjectId } from "mongodb"

class RoleServices {
  async createRole({ payload }: { payload: createRoleReqBody }) {
    const { permissionIds, ...rest } = payload
    const permissionObjectIds = (permissionIds || []).map((id) => new ObjectId(id))
    const role = await databaseService.roles.insertOne(
      new Role({
        permissionIds: permissionObjectIds,
        ...rest
      })
    )
    const { insertedId } = role
    const result = await databaseService.roles.findOne(
      { _id: new ObjectId(insertedId) },
      {
        projection: {
          createdAt: 0,
          updatedAt: 0,
          deletedAt: 0,
          isDeleted: 0
        }
      }
    )
    return result
  }

  async getAllRoles(): Promise<any[]> {
    // Dùng aggregate để "join" với collection 'permissions'
    const roles = await databaseService.roles
      .aggregate([
        {
          $lookup: {
            from: "permissions",
            localField: "permissionIds",
            foreignField: "_id",
            as: "permissions"
          }
        },
        // Bỏ trường mảng 'permissionIds' (vì đã có 'permissions')
        {
          $unset: ["permissionIds", "createdAt", "updatedAt", "deletedAt", "isDeleted"]
        },
        // Biến đổi mảng 'permissions' để chỉ giữ lại các trường cần thiết
        {
          $set: {
            permissions: {
              $map: {
                input: "$permissions", // Lấy mảng permissions đã lookup
                as: "perm", // Đặt tên biến tạm là 'perm'
                in: {
                  // Đây là cấu trúc document MỚI
                  _id: "$$perm._id",
                  name: "$$perm.name",
                  module: "$$perm.module"
                }
              }
            }
          }
        },

        {
          $sort: { module: 1, name: 1 }
        }
      ])
      .toArray()

    return roles
  }

  async updateRole({ role_id, payload }: { role_id: string; payload: updateRoleReqBody }): Promise<Role | null> {
    const { permissionIds, ...rest } = payload
    const updatePayload: any = { ...rest }
    // Nếu người dùng có gửi lên 'permissionIds'
    if (permissionIds) {
      updatePayload.permissionIds = permissionIds.map((id) => new ObjectId(id))
    }

    const result = await databaseService.roles.findOneAndUpdate(
      { _id: new ObjectId(role_id) },
      {
        $set: updatePayload,
        $currentDate: { updatedAt: true }
      },
      {
        returnDocument: "after",
        projection: {
          createdAt: 0,
          updatedAt: 0,
          deletedAt: 0,
          isDeleted: 0
        }
      }
    )

    return result
  }

  async deleteRole(role_id: string): Promise<boolean> {
    const result = await databaseService.roles.updateOne(
      {
        _id: new ObjectId(role_id),
        isDeleted: false
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: RoleStatus.INACTIVE // Tự động set status sang INACTIVE khi xóa
        }
      }
    )

    // result.modifiedCount sẽ là 1 nếu tìm thấy và cập nhật
    return result.modifiedCount > 0
  }
}

const roleServices = new RoleServices()
export default roleServices
