import { ObjectId } from "mongodb"

export interface createIngredientReqBody {
  name: string
  categoryId: string
  unit: string
  minStock: number
  supplierIds?: string[]
}

export interface updateIngredientReqBody {
  name?: string
  categoryId?: ObjectId
  unit?: string
  unitPrice?: number
  currentStock?: number
  minStock?: number
}
