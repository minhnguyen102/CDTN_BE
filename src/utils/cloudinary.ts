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
export const uploadCloud = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB (Tính bằng bytes)
  }
})

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
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined

  // Helper parse JSON an toàn
  const tryParseJSON = (field: string) => {
    if (req.body[field] && typeof req.body[field] === "string") {
      try {
        req.body[field] = JSON.parse(req.body[field])
      } catch (error) {
        req.body[field] = {} // Fallback
      }
    }
  }

  // 1. Parse JSON các trường phức tạp
  tryParseJSON("heroSection")
  tryParseJSON("aboutUsSection")
  tryParseJSON("gallerySection")
  tryParseJSON("socialLinks")
  tryParseJSON("openingHours")

  // 2. Khởi tạo Object rỗng nếu client không gửi (để tránh lỗi undefined)
  if (!req.body.heroSection) req.body.heroSection = { isActive: true, images: [] }
  if (!req.body.heroSection.images) req.body.heroSection.images = []

  if (!req.body.aboutUsSection) req.body.aboutUsSection = { isActive: true, detail: {} }

  if (!req.body.gallerySection)
    req.body.gallerySection = {
      isActive: true,
      title: "",
      description: "",
      images: []
    }
  if (!Array.isArray(req.body.gallerySection.images)) req.body.gallerySection.images = []

  // 3. Xử lý File Upload
  if (files) {
    // Logo & Favicon
    if (files.logo?.[0]) req.body.logoUrl = files.logo[0].path
    if (files.favicon?.[0]) req.body.favicon = files.favicon[0].path

    // About Us Image
    if (files.aboutUsImage?.[0]) {
      req.body.aboutUsSection.image = files.aboutUsImage[0].path
    }

    if (req.body.mapUrl === "null" || req.body.mapUrl === "undefined") {
      req.body.mapUrl = ""
    }

    // Hero Images (Banner) -> Mảng String
    if (files.heroImages) {
      req.body.heroSection.images = files.heroImages.map((file) => file.path)
    }

    // Gallery Images (Không gian) -> Mảng Object {url, description}
    if (files.galleryImages) {
      const uploadedFiles = files.galleryImages
      // Lấy danh sách mô tả gửi kèm từ client
      const galleryData = req.body.gallerySection.images || []

      // Ghép URL ảnh mới với Description tương ứng
      const mergedGallery = uploadedFiles.map((file, index) => {
        // Dùng ?. để tránh lỗi nếu mảng description ngắn hơn mảng ảnh
        const desc = galleryData[index]?.description || ""
        return {
          url: file.path,
          description: desc
        }
      })

      req.body.gallerySection.images = mergedGallery
    }
  }

  next()
}
