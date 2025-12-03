import { Express } from "express"
import guestRoutes from "./guest.routes"

export const routesGuest = (app: Express) => {
  const PATH = "guest"
  app.use(PATH, guestRoutes)
}
