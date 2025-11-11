import { createRoleReqBody } from "../models/requests/Role.request"
import Role from "../models/schema/Role.schema"
import databaseService from "./database.servies"
import { ObjectId } from "mongodb"

class RoleServices {
  async createRole({ payload }: { payload: createRoleReqBody }) {
    const { permissionIds, ...rest } = payload
    console.log("rest", rest)
    const permissionObjectIds = (permissionIds || []).map((id) => new ObjectId(id))
    const role = await databaseService.roles.insertOne(
      new Role({
        permissionIds: permissionObjectIds,
        ...rest
      })
    )
    const { insertedId } = role
    const result = await databaseService.roles.findOne({ _id: new ObjectId(insertedId) })
    return result
  }
}

const roleServices = new RoleServices()
export default roleServices
