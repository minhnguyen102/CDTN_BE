import { ObjectId } from "mongodb"
import RestaurantSettings from "../models/schema/RestaurantSettings.schema"
import databaseService from "./database.servies"
import { UpdateOrCreateReqBody } from "../models/requests/Setting.request"
import { getPublicIdFromUrl } from "../utils/helpers"
import { deleteFileFromCloudinary } from "../utils/cloudinary"

class SettingsService {
  async createOrUpdateSettings({ payload }: { payload: UpdateOrCreateReqBody }) {
    const currentSettings = await databaseService.restaurant_setting.findOne({})
    if (currentSettings) {
      // Check Logo
      if (payload.logoUrl && currentSettings.logoUrl && payload.logoUrl !== currentSettings.logoUrl) {
        const publicId = getPublicIdFromUrl(currentSettings.logoUrl)
        if (publicId) await deleteFileFromCloudinary(publicId)
      }

      // Check Favicon
      if (payload.favicon && currentSettings.favicon && payload.favicon !== currentSettings.favicon) {
        const publicId = getPublicIdFromUrl(currentSettings.favicon)
        if (publicId) await deleteFileFromCloudinary(publicId)
      }
    }

    const defaultSettings = new RestaurantSettings({})
    delete defaultSettings._id
    Object.keys(payload).forEach((key) => {
      // Ép kiểu as any để TS không báo lỗi index signature
      delete (defaultSettings as any)[key]
    })

    const result = await databaseService.restaurant_setting.findOneAndUpdate(
      {},
      {
        $set: payload,
        $setOnInsert: defaultSettings
      },
      {
        upsert: true, // Quan trọng: Không có thì tạo mới
        returnDocument: "after" // Trả về dữ liệu MỚI sau khi update
      }
    )

    return result
  }

  /**
   * Lấy cấu hình hiện tại (Dùng cho cả Admin và Landing Page)
   */
  async getSettings() {
    const settings = await databaseService.restaurant_setting.findOne({})

    // Nếu chưa có gì, trả về null hoặc object mặc định tùy nhu cầu FE
    if (!settings) {
      return null
    }
    return settings
  }
}

export default new SettingsService()
