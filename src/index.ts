import express from "express"
import { routesAdmin } from "~/routes/admins/index.routes"
import databaseService from "~/services/database.servies"
import { defaultErrorHandler } from "./middlewares/error.middlewares"
const app = express()
const port = 3000

app.use(express.json())
app.use(defaultErrorHandler)

// Connect database
databaseService.connect().catch(console.dir)

// Router admin
routesAdmin(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
