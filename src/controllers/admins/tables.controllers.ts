import { Request, Response } from "express"
export const createTableController = async (req: Request, res: Response) => {
  res.json({
    message: "OK"
  })
}
