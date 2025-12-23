import express from "express"
import { routesAdmin } from "./routes/admins/index.routes"
import databaseService from "./services/database.servies"
import { defaultErrorHandler } from "./middlewares/error.middlewares"
import cors, { CorsOptions } from "cors"
import YAML from "yaml"
import fs from "fs"
import path from "path"
import swaggerUi from "swagger-ui-express"
import { routesGuest } from "./routes/guests/index.routes"
import { createServer } from "http"
import { initSocket } from "./utils/socket"
import paymentRouter from "./routes/payments/payment.routes"
import { initScheduledJobs } from "./utils/scheduler"

export const WHILELIST_DOMAINS: string[] = [
  // Môi trường Local
  "http://localhost:3000",
  "http://admin.localhost:3000",
  // "http://localhost:4000",

  // Môi trường Production
  "https://snackio.io.vn",
  "https://www.snackio.io.vn",

  // Môi trường Production
  "https://admin.snackio.io.vn",
  "https://www.admin.snackio.io.vn",

  // Dùng cho Swagger
  "https://api.snackio.io.vn",
  "https://www.api.snackio.io.vn"
]
const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 3000
initSocket(httpServer)

const file = fs.readFileSync(path.resolve("cdtn.swagger.yaml"), "utf8")
const swaggerDocument = YAML.parse(file)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(express.json())

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Các request từ Postman, Server-to-Server thường không có origin -> Cho phép
    // Origin nằm trong WHILELIST_DOMAINS -> Cho phép
    if (!origin || WHILELIST_DOMAINS.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`))
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}
app.use(cors(corsOptions))

// Router admin
routesAdmin(app)
// Router guest
routesGuest(app)
// Payment
app.use("/payment", paymentRouter)

app.use(defaultErrorHandler)

const startServer = async () => {
  try {
    await databaseService.connect()
    console.log("Database connected successfully")

    // Khởi tạo cron 1 lần duy nhất
    initScheduledJobs()

    httpServer.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1) // Tắt app nếu lỗi DB
  }
}

startServer()

// Deploy
export default app
// console.log(generatePassword())
