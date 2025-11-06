import { ObjectId } from "mongodb"

interface IngredientType {
  _id?: ObjectId
  name: string
  unit: string
  unitPrice: number
  currentStock: number
  minStock: number
  createdAt: Date
  updatedAt: Date
}

export default class Ingredient {
  _id?: ObjectId
  name: string
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
    this.unit = ingredient.unit
    this.unitPrice = ingredient.unitPrice
    this.currentStock = ingredient.currentStock
    this.minStock = ingredient.minStock
    this.createdAt = ingredient.createdAt || date
    this.updatedAt = ingredient.updatedAt || date
  }
}
