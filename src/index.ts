import express, { Router } from "express"
import { routesAdmin } from "./routes/admins/index.routes"
const app = express()
const port = 3000

routesAdmin(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
