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

    // =================================================================
    // 🟢 BƯỚC 1: LOGIC MERGE (GIỮ LẠI ẢNH CŨ NẾU KHÔNG CÓ ẢNH MỚI)
    // =================================================================
    if (currentSettings) {
      // 1. Logo & Favicon
      // Nếu payload không gửi logo mới (undefined/null/empty), nhưng DB đang có -> Lấy lại cái cũ
      if (!payload.logoUrl && currentSettings.logoUrl) {
        payload.logoUrl = currentSettings.logoUrl
      }
      if (!payload.favicon && currentSettings.favicon) {
        payload.favicon = currentSettings.favicon
      }

      // 2. About Us Section
      // Nếu có gửi thông tin About Us (text) nhưng không gửi file ảnh mới
      if (payload.aboutUsSection) {
        if (!payload.aboutUsSection.image && currentSettings.aboutUsSection?.image) {
          payload.aboutUsSection.image = currentSettings.aboutUsSection.image
        }

        // Giữ lại cả detail cũ nếu payload không gửi lên (tùy chọn)
        if (!payload.aboutUsSection.detail && currentSettings.aboutUsSection?.detail) {
          payload.aboutUsSection.detail = currentSettings.aboutUsSection.detail
        }
      }

      // 3. Hero Section (Banner)
      if (payload.heroSection) {
        // Nếu mảng ảnh mới RỖNG, thì giữ lại mảng ảnh cũ
        // (Nghĩa là user chỉ update text isActive, không upload banner mới)
        const newImages = payload.heroSection.images || []
        if (newImages.length === 0 && currentSettings.heroSection?.images?.length > 0) {
          payload.heroSection.images = currentSettings.heroSection.images
        }
      }

      // 4. Gallery Section
      if (payload.gallerySection) {
        const newImages = payload.gallerySection.images || []
        if (newImages.length === 0 && currentSettings.gallerySection?.images?.length > 0) {
          payload.gallerySection.images = currentSettings.gallerySection.images
        }
      }
    }

    // =================================================================
    // 🟡 BƯỚC 2: LOGIC CLEANUP (XÓA ẢNH THỪA)
    // =================================================================
    // Lúc này payload đã có đầy đủ ảnh (mới hoặc cũ). Logic so sánh sẽ hoạt động đúng.
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
      // Nếu payload lấy lại ảnh cũ (ở Bước 1), thì newAbout === oldAbout -> Điều kiện này false -> KHÔNG XÓA (Đúng)
      // Nếu payload có ảnh mới tinh, thì newAbout !== oldAbout -> XÓA CŨ (Đúng)
      if (newAbout && oldAbout && newAbout !== oldAbout) {
        const pid = getPublicIdFromUrl(oldAbout)
        if (pid) await deleteFileFromCloudinary(pid)
      }

      // 3. Hero Images
      if (payload.heroSection?.images) {
        const oldHeroImgs = currentSettings.heroSection?.images || []
        const newHeroImgs = payload.heroSection.images
        await this.deleteStaleImages(oldHeroImgs, newHeroImgs)
      }

      // 4. Gallery Images
      if (payload.gallerySection?.images) {
        const oldGalleryUrls = (currentSettings.gallerySection?.images || []).map((item: any) => {
          return typeof item === "string" ? item : item.url
        })

        const newGalleryUrls = payload.gallerySection.images.map((item: any) => item.url)
        await this.deleteStaleImages(oldGalleryUrls, newGalleryUrls)
      }
    }

    // =================================================================
    // 🔴 BƯỚC 3: LƯU DB (Giữ nguyên)
    // =================================================================
    const defaultSettings = new RestaurantSettings({} as any)
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
