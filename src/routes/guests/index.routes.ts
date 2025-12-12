import { Express } from "express"
import guestRoutes from "./auth.routes"
import menuGuestRoutes from "./menu.routes"
import orderGuestRoutes from "./order.routes"
import guestReviewsRouter from "./review.routes"

export const routesGuest = (app: Express) => {
  const PATH = "/guest"
  app.use(PATH + "/auth", guestRoutes)
  app.use(PATH + "/menu", menuGuestRoutes)
  app.use(PATH + "/orders", orderGuestRoutes)
  app.use(PATH + "/reviews", guestReviewsRouter)
}
