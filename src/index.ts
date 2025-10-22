import express, { Router } from "express"
import { routesAdmin } from "./routes/admins/index.routes"
import databaseService from "~/services/database.servies"
const app = express()
const port = 3000

// Connect database
databaseService.connect().catch(console.dir)

// Router admin
routesAdmin(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
