import { ObjectId } from "mongodb"

interface IngredientType {
  _id?: ObjectId
  name: string
  categoryId: ObjectId
  unit: string
  minStock: number
  name_search: string
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
    this.unitPrice = ingredient.unitPrice || 0
    this.currentStock = ingredient.currentStock || 0
    this.minStock = ingredient.minStock
    this.createdAt = ingredient.createdAt || date
    this.updatedAt = ingredient.updatedAt || date
  }
}
