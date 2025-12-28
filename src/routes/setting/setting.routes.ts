import { Router } from "express"
import { wrapHandlerFunction } from "../../utils/wrapHandler"
import { accessTokenValidation } from "../../middlewares/admins/accounts.middlewares"
import { verifiedUserValidation } from "../../middlewares/admins/accounts.middlewares"
import { getSettingsController, updateSettingsController } from "../../controllers/setting/setting.controllers"
import { updateSettingsValidation } from "../../middlewares/settings.middlewares"
import { parseCloudinaryFiles, uploadCloud } from "../../utils/cloudinary"

const settingsRouter = Router()

/**
 * Path: /settings
 * Method: GET
 * Note: Nếu trang Landing Page cần gọi thì BỎ middleware auth đi.
 */
settingsRouter.get("/", wrapHandlerFunction(getSettingsController))

/**
 * Path: /settings
 * Method: PUT
 * Desc: Admin cập nhật cấu hình
 * Body: { brandName: "...", socialLinks: [...] }
 */
settingsRouter.patch(
  "/",
  accessTokenValidation,
  verifiedUserValidation,
  uploadCloud.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
    { name: "aboutUsImage", maxCount: 1 }, // 1 Ảnh cho phần About
    { name: "heroImages", maxCount: 5 }, // Tối đa 5 ảnh banner
    { name: "galleryImages", maxCount: 10 } // Tối đa 10 ảnh không gian
  ]),
  parseCloudinaryFiles,
  updateSettingsValidation,
  wrapHandlerFunction(updateSettingsController)
)

export default settingsRouter
