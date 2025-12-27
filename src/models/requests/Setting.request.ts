import { OpeningHour } from "../../models/schema/RestaurantSettings.schema"
import { SocialLink } from "../../models/schema/RestaurantSettings.schema"

export interface UpdateOrCreateReqBody {
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
