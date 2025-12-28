import { ObjectId } from "mongodb"

export interface SocialLink {
  platform: "Facebook" | "Instagram" | "Youtube" | "Tiktok" | "Zalo"
  url: string
}

export interface OpeningHour {
  label: string
  time: string
}

// Interface cho phần Hero (Slide)
export interface HeroSection {
  isActive: boolean
  images: string[]
}

// Interface cho phần About Us
export interface AboutUsSection {
  isActive: boolean
  image: string
  title: string
  content: string
}
// 3. Interface cho phần Gallery (Không gian)
export interface GallerySection {
  isActive: boolean
  title: string
  images: string[]
}

// Định nghĩa dữ liệu gửi lên. Chỉ cần gửi 1 trường khi tạo mới cũng đc, từ những lần sau sẽ chỉ là cập nhật
interface RestaurantSettingsType {
  _id?: ObjectId
  brandName?: string
  slogan?: string
  description?: string
  logoUrl?: string
  favicon?: string

  address?: string
  googleMapUrl?: string
  hotline?: string
  email?: string

  socialLinks?: SocialLink[]
  openingHours?: OpeningHour[]
  heroSection?: HeroSection
  aboutUsSection?: AboutUsSection
  gallerySection?: GallerySection
}

export default class RestaurantSettings {
  _id?: ObjectId
  brandName: string
  slogan: string
  description: string
  logoUrl: string
  favicon: string

  address: string
  googleMapUrl: string
  hotline: string
  email: string

  socialLinks: SocialLink[]
  openingHours: OpeningHour[]

  heroSection: HeroSection
  aboutUsSection: AboutUsSection
  gallerySection: GallerySection

  constructor(data: RestaurantSettingsType) {
    this._id = data._id
    this.brandName = data.brandName || "SNACKIO"
    this.slogan = data.slogan || ""
    this.description = data.description || ""
    this.logoUrl = data.logoUrl || ""
    this.favicon = data.favicon || ""

    this.address = data.address || ""
    this.googleMapUrl = data.googleMapUrl || ""
    this.hotline = data.hotline || ""
    this.email = data.email || ""

    this.socialLinks = data.socialLinks || []
    this.openingHours = data.openingHours || []

    this.heroSection = data.heroSection || {
      isActive: true,
      images: []
    }

    this.aboutUsSection = data.aboutUsSection || {
      isActive: true,
      image: "",
      title: "Về chúng tôi",
      content: "Nội dung đang cập nhật..."
    }

    this.gallerySection = data.gallerySection || {
      isActive: true,
      title: "Không gian nhà hàng",
      images: []
    }
  }
}
