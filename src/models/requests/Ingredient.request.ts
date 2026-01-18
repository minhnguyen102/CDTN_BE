import { ObjectId } from "mongodb"

export interface createIngredientReqBody {
  name: string
  categoryId: string
  unit: string
  minStock: number
  supplierIds?: string[]
}

export interface updateIngredientReqBody {
  categoryId?: ObjectId
  minStock?: number
  currentStock?: number
  supplierIds?: ObjectId[]
}
