import { ObjectId } from "mongodb"

interface ImportOrderItem {
  ingredientId: string // -> ingredient
  ingredientName: string
  quantity: number
  importPrice: number
  // total: number
}

export interface CreateImportOrderReqBody {
  supplierId: string // -> supplier
  taxRate: number
  notes: string
  importDate: string
  status: string // nên cải thiện thành enum
  items: ImportOrderItem[]
  // subtotal: number
}
