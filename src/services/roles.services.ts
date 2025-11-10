import { createRoleReqBody } from "../models/requests/Role.request"
import databaseService from "./database.servies"
import Role from "../models/schema/Role.schema"
import { ObjectId } from "mongodb"

class RoleServices {
  async createRole({ payload }: { payload: createRoleReqBody }) {
    const role = await databaseService.roles.insertOne(new Role(payload))
    const { insertedId } = role
    const result = await databaseService.roles.findOne({ _id: new ObjectId(insertedId) })
    return result
  }
}

const roleServices = new RoleServices()
export default roleServices
