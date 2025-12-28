import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer from "multer"
import dotenv from "dotenv"
import { Request, Response, NextFunction } from "express"

dotenv.config()

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Cấu hình nơi lưu trữ (Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "restaurant-app", // Tên folder trên Cloudinary
      format: "jpg", // Ép về định dạng jpg (hoặc để file.mimetype)
      public_id: `img_${Date.now()}` // Đặt tên file để không bị trùng
    } as any // Ép kiểu any để tránh lỗi type của thư viện này
  }
})

// Khởi tạo Multer Upload Middleware
export const uploadCloud = multer({ storage })

// Hàm xóa ảnh (Dùng khi update hoặc xóa món ăn)
export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.log("Delete image error:", error)
    throw error
  }
}

export const deleteFileFromCloudinary = async (filename: string) => {
  try {
    // filename trong multer-storage-cloudinary chính là public_id
    await cloudinary.uploader.destroy(filename)
    console.log(`Deleted file from Cloudinary: ${filename}`)
  } catch (error) {
    console.error(`Error deleting file from Cloudinary: ${error}`)
  }
}

export const parseCloudinaryFiles = (req: Request, res: Response, next: NextFunction) => {
  // Vì upload.fields trả về object dictionary nên phải ép kiểu
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined

  if (!files) {
    return next()
  }

  const tryParseJSON = (field: string) => {
    if (req.body[field] && typeof req.body[field] === "string") {
      try {
        req.body[field] = JSON.parse(req.body[field])
      } catch (error) {
        console.log(`Lỗi parse JSON trường ${field}:`, error)
        // Nếu lỗi thì giữ nguyên hoặc set về undefined tùy logic
      }
    }
  }
  tryParseJSON("socialLinks")
  tryParseJSON("openingHours")
  tryParseJSON("heroSection")
  tryParseJSON("aboutUsSection")
  tryParseJSON("gallerySection")

  if (!req.body.heroSection) req.body.heroSection = {}
  if (!req.body.aboutUsSection) req.body.aboutUsSection = {}
  if (!req.body.gallerySection) req.body.gallerySection = {}
  if (files) {
    if (files.logo?.[0]) {
      req.body.logoUrl = files.logo[0].path
    }
    if (files.favicon?.[0]) {
      req.body.favicon = files.favicon[0].path
    }
    if (files.qrCode?.[0]) {
      req.body.bankInfo.qrCodeUrl = files.qrCode[0].path
    }

    if (files.aboutUsImage?.[0]) {
      req.body.aboutUsSection.image = files.aboutUsImage[0].path
    }

    if (files.heroImages) {
      req.body.heroSection.images = files.heroImages.map((file) => file.path)
    }

    if (files.galleryImages) {
      req.body.gallerySection.images = files.galleryImages.map((file) => file.path)
    }
  }
  next()
}
