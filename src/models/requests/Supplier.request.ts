import { SupplierStatus } from "../../constants/enums"

export interface createSupplierReqBody {
  name: string
  taxCode: string
  status: SupplierStatus
  contactPerson: string // Hieu Bui
  phone: string
  email: string
  address: string
}
