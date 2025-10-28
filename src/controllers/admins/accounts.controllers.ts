import { Request, Response } from "express"
import { RegisterReqBody } from "~/models/requests/Account.request"
import accountsServices from "~/services/accounts.services"
import { ParamsDictionary } from "express-serve-static-core"

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

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  throw new Error("Loi roi")
  const result = await accountsServices.register(req.body)
  res.json({
    message: "Register success",
    result
  })
}
