import express, { Router } from "express"
import { routesAdmin } from "./routes/admins/index.routes"
import { run } from "~/services/database.servies"
const app = express()
const port = 3000

run().catch(console.dir)

// Router admin
routesAdmin(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
