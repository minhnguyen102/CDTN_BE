import { ObjectId } from "mongodb"

interface IngredientType {
  _id?: ObjectId
  name: string
  categoryId: ObjectId
  unit: string
  unitPrice: number
  minStock: number
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
    this.unitPrice = ingredient.unitPrice
    this.currentStock = ingredient.currentStock || 0
    this.minStock = ingredient.minStock
    this.createdAt = ingredient.createdAt || date
    this.updatedAt = ingredient.updatedAt || date
  }
}
