import express from "express"
import { routesAdmin } from "./routes/admins/index.routes"
import databaseService from "./services/database.servies"
import { defaultErrorHandler } from "./middlewares/error.middlewares"
import cors from "cors"
const app = express()
const port = 3000

app.use(express.json())

//cors
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
}
app.use(cors(corsOptions))

// Connect database
databaseService.connect().catch(console.dir)

// Router admin
routesAdmin(app)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Deploy
// export default app
