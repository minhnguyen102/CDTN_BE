export interface createPermissionReqBody {
  name: string
  description?: string
  module?: string
}
export interface updatePermissionReqBody {
  name?: string
  description?: string
  module?: string
}
