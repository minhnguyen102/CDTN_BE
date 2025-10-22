import { Express } from "express"
import accountRoutes from "./accounts.routes"

export const routesAdmin = (app: Express) => {
  const PATH_ADMIN = "/admin"
  app.use(PATH_ADMIN + "/accounts", accountRoutes)
}
