import { ObjectId } from "mongodb"

interface IngredientType {
  _id?: ObjectId
  name: string
  categoryId: ObjectId
  unit: string
  minStock: number
  name_search: string
  supplierIds?: string[]
  unitPrice?: number
  currentStock?: number
  createdAt?: Date
  updatedAt?: Date
}

export default class Ingredient {
  _id?: ObjectId
  name: string
  categoryId: ObjectId
  unit: string
  unitPrice: number
  supplierIds: ObjectId[]
  name_search: string
  currentStock: number
  minStock: number
  createdAt: Date
  updatedAt: Date

  constructor(ingredient: IngredientType) {
    const date = new Date()
    this._id = ingredient._id
    this.name = ingredient.name
    this.categoryId = ingredient.categoryId
    this.unit = ingredient.unit
    this.name_search = ingredient.name_search
    this.supplierIds = (ingredient.supplierIds || []).map((id) => new ObjectId(id))
    this.unitPrice = ingredient.unitPrice || 0
    this.currentStock = ingredient.currentStock || 0
    this.minStock = ingredient.minStock
    this.createdAt = ingredient.createdAt || date
    this.updatedAt = ingredient.updatedAt || date
  }
}
