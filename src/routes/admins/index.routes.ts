import { Express } from "express"
import accountRoutes from "./accounts.routes"
import tableRoutes from "./tables.routes"
import supplierRoutes from "./suppliers.routes"

export const routesAdmin = (app: Express) => {
  const PATH_ADMIN = "/admin"
  app.use(PATH_ADMIN + "/accounts", accountRoutes)
  app.use(PATH_ADMIN + "/tables", tableRoutes)
  app.use(PATH_ADMIN + "/suppliers", supplierRoutes)
}
