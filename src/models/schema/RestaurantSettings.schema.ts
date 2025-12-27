import { ObjectId } from "mongodb"

export interface SocialLink {
  platform: "Facebook" | "Instagram" | "Youtube" | "Tiktok" | "Zalo"
  url: string
}

export interface OpeningHour {
  label: string
  time: string
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
  }
}
