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

  async createOrUpdateSettings(payload: any) {
    const currentSettings = await databaseService.restaurant_setting.findOne({})

    // --- LOGIC CLEANUP ẢNH CŨ ---
    if (currentSettings) {
      // 1. Logo & Favicon
      if (payload.logoUrl && currentSettings.logoUrl && payload.logoUrl !== currentSettings.logoUrl) {
        const pid = getPublicIdFromUrl(currentSettings.logoUrl)
        if (pid) await deleteFileFromCloudinary(pid)
      }
      if (payload.favicon && currentSettings.favicon && payload.favicon !== currentSettings.favicon) {
        const pid = getPublicIdFromUrl(currentSettings.favicon)
        if (pid) await deleteFileFromCloudinary(pid)
      }

      // 2. About Us Image
      const oldAbout = currentSettings.aboutUsSection?.image
      const newAbout = payload.aboutUsSection?.image
      if (newAbout && oldAbout && newAbout !== oldAbout) {
        const pid = getPublicIdFromUrl(oldAbout)
        if (pid) await deleteFileFromCloudinary(pid)
      }

      // 3. Hero Images (Mảng String)
      if (payload.heroSection?.images) {
        const oldHeroImgs = currentSettings.heroSection?.images || []
        const newHeroImgs = payload.heroSection.images
        await this.deleteStaleImages(oldHeroImgs, newHeroImgs)
      }

      // 4. Gallery Images (Mảng Object -> Cần map ra URL)
      if (payload.gallerySection?.images) {
        // Lấy list URL cũ
        const oldGalleryUrls = (currentSettings.gallerySection?.images || []).map((item: any) => {
          return typeof item === "string" ? item : item.url
        })

        // Lấy list URL mới
        const newGalleryUrls = payload.gallerySection.images.map((item: any) => item.url)

        await this.deleteStaleImages(oldGalleryUrls, newGalleryUrls)
      }
    }

    // --- LOGIC LƯU DB ---
    const defaultSettings = new RestaurantSettings({} as any)
    delete defaultSettings._id

    // Xóa các key trong default để tránh ghi đè dữ liệu user gửi lên bằng giá trị rỗng
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
