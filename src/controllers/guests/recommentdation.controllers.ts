import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import aiService from "../../services/ai.services"
import { getRecommnentReqBody } from "../../models/requests/Recommentdation.request"

export const getRecommentdationController = async (
  req: Request<ParamsDictionary, any, getRecommnentReqBody>,
  res: Response
) => {
  const { dishIds } = req.body

  const result = await aiService.getCartRecomendations({ dishIds })

  res.json({
    message: "Get cart recommendations success",
    data: result
  })
}
