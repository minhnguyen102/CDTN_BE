import { Express } from "express"
import accountRoutes from "./accounts.routes"
import tableRoutes from "./tables.routes"
import supplierRoutes from "./suppliers.routes"
import categoriesRouter from "./categories.routes"
import ingredientsRouter from "./ingredients.routes"
import rolesRouter from "./roles.routes"
import permissionsRouter from "./permissions.routes"
import importOrderRoutes from "./importOrder.routes"
import dishCategoriesRoutes from "./dishCategories.routes"
import dishesRoutes from "./dishs.routes"
import ordersRouter from "./orders.routes"

export const routesAdmin = (app: Express) => {
  const PATH_ADMIN = "/admin"
  app.use(PATH_ADMIN + "/accounts", accountRoutes)
  app.use(PATH_ADMIN + "/tables", tableRoutes)
  app.use(PATH_ADMIN + "/suppliers", supplierRoutes)
  app.use(PATH_ADMIN + "/categories", categoriesRouter)
  app.use(PATH_ADMIN + "/ingredients", ingredientsRouter)
  app.use(PATH_ADMIN + "/roles", rolesRouter)
  app.use(PATH_ADMIN + "/permissions", permissionsRouter)
  app.use(PATH_ADMIN + "/import-orders", importOrderRoutes)
  app.use(PATH_ADMIN + "/dish-categories", dishCategoriesRoutes)
  app.use(PATH_ADMIN + "/dishes", dishesRoutes)
  app.use(PATH_ADMIN + "/orders", ordersRouter)
}
