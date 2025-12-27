import { Request } from "express"
interface PaginationParams {
  page: number
  limit: number
}

interface PaginationOptions {
  defaultLimit?: number
  allowLimits?: number[]
}

export const paginationQueryParser = (req: Request, options: PaginationOptions = {}): PaginationParams => {
  // 1. Xử lý 'page'
  let page = parseInt(req.query.page as string) || 1
  if (page <= 0) {
    page = 1
  }

  // 2. Xử lý 'limit'
  const { defaultLimit = 10, allowLimits = [5, 10, 15] } = options
  let limit = defaultLimit

  const limitFromQuery = req.query.limit as string
  if (limitFromQuery) {
    const parseLimit = Number(limitFromQuery)
    if (allowLimits.includes(parseLimit)) {
      limit = parseLimit
    }
  }

  return {
    page,
    limit
  }
}

export const removeAccents = (str: string) => {
  return str
    .normalize("NFD") // Tách dấu ra khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, "") // Xóa các dấu đã tách
    .replace(/đ/g, "d") // Xử lý chữ đ thường
    .replace(/Đ/g, "D") // Xử lý chữ Đ hoa
}
// Chuuyeenr đổi từ giờ sang phút "19:30" -> 1170 (phút)
export const parseTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number)
  return hours * 60 + minutes
}

export const getPublicIdFromUrl = (url: string) => {
  try {
    // Regex này cắt lấy phần sau chữ 'upload/' (và bỏ qua version v123...) và trước dấu chấm đuôi file
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/
    const match = url.match(regex)
    return match ? match[1] : null
  } catch (error) {
    return null
  }
}
