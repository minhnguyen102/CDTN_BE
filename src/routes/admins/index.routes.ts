import { Express } from "express"
import AccountRoutes from "./accounts.routes"

export const routesAdmin = (app: Express) => {
  const PATH_ADMIN = "/admin"
  app.use(PATH_ADMIN + "/accounts", AccountRoutes)
}
