import { Request } from "express"

/**
 *  Tham số nhận vào (1 object có dạng định trả về, totalDocument)
 *
 * Mục đích của pagination helper => Trả về object {
 *  currentPage: 2
 *  limitItem: 10 // cố định
 *  skip: Sau tính toán (= (currentPage -1) * limitItem)
 *  totalPage: Sau tính toán (= Math.celi(totalDocument / limitItem)) <= totalPage : count db
 * }
 */
interface objectPaginationType {
  currentPage: number
  skip?: number
  limit: number
  totalPage?: number
}
export function paginationHelper({
  totalDocument,
  objectPagination
}: {
  totalDocument: number
  objectPagination: objectPaginationType
}) {
  objectPagination.skip = (objectPagination.currentPage - 1) * objectPagination.limit
  objectPagination.totalPage = Math.ceil(totalDocument / objectPagination.limit)
  return objectPagination
}
