import { Router } from "express"

const AccountRoutes = Router()

AccountRoutes.get("/", (req, res) => {
  res.send("Hello World!")
})

export default AccountRoutes
