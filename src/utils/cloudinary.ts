import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer from "multer"
import dotenv from "dotenv"

dotenv.config()

// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// 2. Cấu hình nơi lưu trữ (Storage)
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

// 3. Khởi tạo Multer Upload Middleware
export const uploadCloud = multer({ storage })

// 4. Hàm xóa ảnh (Dùng khi update hoặc xóa món ăn)
export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    console.log(result)
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
