import { Db, MongoClient, Collection } from "mongodb"
import { config } from "dotenv"
import Account from "../models/schema/Account.schema"
import RefreshToken from "../models/schema/RefreshToken.schema"
import Table from "../models/schema/Table.schema"
import Supplier from "../models/schema/Supplier.schema"
import Ingredient from "../models/schema/Ingredient.schema"
import ImportOrder from "../models/schema/ImportOrder.schema"
import Category from "../models/schema/Category.schema"
import Role from "../models/schema/Role.schema"
import Permission from "../models/schema/Permission.schema"
import DishCategory from "../models/schema/DishCategory.schema"
import Dish from "../models/schema/Dish.schema"
import Order from "../models/schema/Order.schema"
import Review from "../models/schema/Review.schema"
import Recommendation from "../models/schema/Recomendation.schema"
import Booking from "../models/schema/Booking.schema"
config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.sqjfe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

class DatabaseService {
  private _client: MongoClient
  private db: Db
  constructor() {
    this._client = new MongoClient(uri)
    this.db = this._client.db(process.env.DB_NAME)
  }

  get client() {
    return this._client
  }

  async connect() {
    try {
      // Connect the _client to the server	(optional starting in v4.7)
      await this._client.connect()
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log("Pinged your deployment. You successfully connected to MongoDB!")
    } catch (err) {
      console.log(err)
      throw err
    }
  }

  get accounts(): Collection<Account> {
    return this.db.collection("accounts")
  }

  get refresh_tokens(): Collection<RefreshToken> {
    return this.db.collection("refresh_tokens")
  }

  get tables(): Collection<Table> {
    return this.db.collection("tables")
  }

  get suppliers(): Collection<Supplier> {
    return this.db.collection("suppliers")
  }

  get ingredients(): Collection<Ingredient> {
    return this.db.collection("ingredients")
  }
  get import_orders(): Collection<ImportOrder> {
    return this.db.collection("import_orders")
  }
  get categories(): Collection<Category> {
    return this.db.collection("categories")
  }
  get roles(): Collection<Role> {
    return this.db.collection("roles")
  }
  get permissions(): Collection<Permission> {
    return this.db.collection("permissions")
  }
  get dishes(): Collection<Dish> {
    return this.db.collection("dishes")
  }
  get dish_categories(): Collection<DishCategory> {
    return this.db.collection("dish_categories")
  }
  get orders(): Collection<Order> {
    return this.db.collection("orders")
  }
  get reviews(): Collection<Review> {
    return this.db.collection("reviews")
  }
  get recommendations(): Collection<Recommendation> {
    return this.db.collection("recommendations")
  }
  get bookings(): Collection<Booking> {
    return this.db.collection("bookings")
  }
}

const databaseService = new DatabaseService()
export default databaseService
