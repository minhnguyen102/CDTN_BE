import { ObjectId } from "mongodb"

export interface SocialLink {
  platform: "Facebook" | "Instagram" | "Youtube" | "Tiktok" | "Zalo"
  url: string
}

export interface OpeningHour {
  label: string
  time: string
}

export interface HeroSection {
  isActive: boolean
  images: string[]
}

export interface AboutUsSection {
  isActive: boolean
  image: string
  title: string
  content: string
  detail: {
    years: number
    total_orders: number
    branches: number
    percent_love: number
  }
}

export interface GallerySection {
  isActive: boolean
  title: string
  description: string
  images: {
    description: string
    url: string
  }[]
}

interface RestaurantSettingsType {
  _id?: ObjectId
  brandName?: string
  slogan?: string
  description?: string
  logoUrl?: string
  favicon?: string
  address?: string
  hotline?: string
  email?: string
  mapUrl?: string
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
  hotline: string
  email: string
  mapUrl: string
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
    this.hotline = data.hotline || ""
    this.email = data.email || ""
    this.mapUrl = data.mapUrl || ""
    this.socialLinks = data.socialLinks || []
    this.openingHours = data.openingHours || []

    this.heroSection = data.heroSection || {
      isActive: true,
      images: []
    }

    // --- CẬP NHẬT: Thêm default cho field detail ---
    this.aboutUsSection = data.aboutUsSection || {
      isActive: true,
      image: "",
      title: "Về chúng tôi",
      content: "Nội dung đang cập nhật...",
      detail: {
        years: 0,
        total_orders: 0,
        branches: 0,
        percent_love: 0
      }
    }
    // Phòng hờ trường hợp data gửi lên có aboutUsSection nhưng thiếu detail
    if (this.aboutUsSection && !this.aboutUsSection.detail) {
      this.aboutUsSection.detail = {
        years: 0,
        total_orders: 0,
        branches: 0,
        percent_love: 0
      }
    }

    this.gallerySection = data.gallerySection || {
      title: "",
      description: "Không gian ấm cúng, sang trọng cùng những món ăn tinh tếe",
      isActive: true,
      images: []
    }

    // Logic phòng hờ data cũ (string[]) map sang object
    if (this.gallerySection.images && this.gallerySection.images.length > 0) {
      if (typeof this.gallerySection.images[0] === "string") {
        this.gallerySection.images = (this.gallerySection.images as any).map((url: string) => ({
          url: url,
          description: ""
        }))
      }
    }
  }
}
