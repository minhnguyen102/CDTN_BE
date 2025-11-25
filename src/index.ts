import express from "express"
import { routesAdmin } from "./routes/admins/index.routes"
import databaseService from "./services/database.servies"
import { defaultErrorHandler } from "./middlewares/error.middlewares"
import cors from "cors"
import YAML from "yaml"
import fs from "fs"
import path from "path"
import swaggerUi from "swagger-ui-express"
import { generatePassword } from "./utils/crypto"
const app = express()
const port = 3000

const file = fs.readFileSync(path.resolve("cdtn.swagger.yaml"), "utf8")
const swaggerDocument = YAML.parse(file)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(express.json())

//cors
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
}
// app.use(cors(corsOptions))
app.use(cors())

// Router admin
routesAdmin(app)

app.use(defaultErrorHandler)

// // Connect database
// databaseService.connect().catch(console.dir)

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

const startServer = async () => {
  try {
    await databaseService.connect()
    console.log("Database connected successfully")

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1) // Tắt app nếu lỗi DB
  }
}

startServer()

// Deploy
// export default app
// console.log(generatePassword())
