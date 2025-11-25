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
    .normalize("NFD") // Bước 1: Tách dấu ra khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, "") // Bước 2: Xóa các dấu đã tách
    .replace(/đ/g, "d") // Bước 3: Xử lý chữ đ thường
    .replace(/Đ/g, "D") // Bước 4: Xử lý chữ Đ hoa
}
