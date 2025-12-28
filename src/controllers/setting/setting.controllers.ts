import { Request, Response } from "express"
import settingsService from "../../services/settings.services"
import { ParamsDictionary } from "express-serve-static-core"
import { UpdateOrCreateReqBody } from "../../models/requests/Setting.request"

export const updateSettingsController = async (
  req: Request<ParamsDictionary, any, UpdateOrCreateReqBody>,
  res: Response
) => {
  const payload = req.body

  const updatedSettings = await settingsService.createOrUpdateSettings(payload)

  return res.status(200).json({
    message: "Cập nhật cấu hình nhà hàng thành công!",
    data: updatedSettings
  })
}

export const getSettingsController = async (req: Request, res: Response) => {
  const settings = await settingsService.getSettings()

  return res.status(200).json({
    message: "Lấy cấu hình thành công",
    data: settings
  })
}
