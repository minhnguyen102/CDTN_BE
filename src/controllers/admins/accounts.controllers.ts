import { Request, Response } from "express"
import Account from "~/models/schema/Account.schema"
import accountsServices from "~/services/accounts.services"
import databaseService from "~/services/database.servies"

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  const result = await accountsServices.login({ email, password })
  if (result) {
    res.json({
      message: "Login success"
    })
  } else {
    res.status(400).json({
      message: "Login failed"
    })
  }
}

export const registerController = async (req: Request, res: Response) => {
  const { name, email, password, date_of_birth, role } = req.body
  const result = await databaseService.accounts.insertOne(new Account(req.body))
  console.log(result)
  res.json({
    message: "Register success",
    result
  })
}
