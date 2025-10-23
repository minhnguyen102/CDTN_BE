import { Db, MongoClient, Collection } from "mongodb"
import { config } from "dotenv"
import Account from "~/models/schema/Account.schema"
config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.sqjfe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await this.client.connect()
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
}

const databaseService = new DatabaseService()
export default databaseService
