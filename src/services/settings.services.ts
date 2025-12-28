import { ObjectId } from "mongodb"
import RestaurantSettings from "../models/schema/RestaurantSettings.schema"
import databaseService from "./database.servies"
import { UpdateOrCreateReqBody } from "../models/requests/Setting.request"
import { getPublicIdFromUrl } from "../utils/helpers"
import { deleteFileFromCloudinary } from "../utils/cloudinary"

class SettingsService {
  /**
   * Hàm helper riêng: Xóa các ảnh có trong danh sách cũ nhưng KHÔNG có trong danh sách mới
   */
  private async deleteStaleImages(oldUrls: string[], newUrls: string[]) {
    // Lọc ra các ảnh bị loại bỏ
    const imagesToDelete = oldUrls.filter((oldUrl) => !newUrls.includes(oldUrl))

    if (imagesToDelete.length > 0) {
      // Xóa song song
      await Promise.all(
        imagesToDelete.map((url) => {
          const publicId = getPublicIdFromUrl(url)
          if (publicId) return deleteFileFromCloudinary(publicId)
        })
      )
    }
  }

  async createOrUpdateSettings({ payload }: { payload: UpdateOrCreateReqBody }) {
    const currentSettings = await databaseService.restaurant_setting.findOne({})

    // --- LOGIC XÓA ẢNH CŨ TRÊN CLOUD ---
    if (currentSettings) {
      if (payload.logoUrl && currentSettings.logoUrl && payload.logoUrl !== currentSettings.logoUrl) {
        const publicId = getPublicIdFromUrl(currentSettings.logoUrl)
        if (publicId) await deleteFileFromCloudinary(publicId)
      }

      if (payload.favicon && currentSettings.favicon && payload.favicon !== currentSettings.favicon) {
        const publicId = getPublicIdFromUrl(currentSettings.favicon)
        if (publicId) await deleteFileFromCloudinary(publicId)
      }

      const oldAboutImg = currentSettings.aboutUsSection?.image
      const newAboutImg = payload.aboutUsSection?.image
      if (newAboutImg && oldAboutImg && newAboutImg !== oldAboutImg) {
        const publicId = getPublicIdFromUrl(oldAboutImg)
        if (publicId) await deleteFileFromCloudinary(publicId)
      }

      if (payload.heroSection?.images) {
        const oldHeroImages = currentSettings.heroSection?.images || []
        const newHeroImages = payload.heroSection.images
        await this.deleteStaleImages(oldHeroImages, newHeroImages)
      }

      if (payload.gallerySection?.images) {
        const oldGalleryImages = currentSettings.gallerySection?.images || []
        const newGalleryImages = payload.gallerySection.images
        await this.deleteStaleImages(oldGalleryImages, newGalleryImages)
      }
    }

    const defaultSettings = new RestaurantSettings({})
    delete defaultSettings._id

    Object.keys(payload).forEach((key) => {
      delete (defaultSettings as any)[key]
    })

    const result = await databaseService.restaurant_setting.findOneAndUpdate(
      {},
      {
        $set: payload,
        $setOnInsert: defaultSettings
      },
      {
        upsert: true,
        returnDocument: "after"
      }
    )

    return result
  }

  /**
   * Lấy cấu hình hiện tại (Dùng cho cả Admin và Landing Page)
   */
  async getSettings() {
    const settings = await databaseService.restaurant_setting.findOne({})

    if (!settings) {
      return null
    }
    return settings
  }
}

export default new SettingsService()
