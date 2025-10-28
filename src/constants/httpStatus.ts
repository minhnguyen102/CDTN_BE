const HTTP_STATUS = {
  // === 2xx: Success ===
  /**
   * Yêu cầu thành công.
   */
  OK: 200,
  /**
   * Yêu cầu đã được hoàn thành và một tài nguyên mới đã được tạo.
   * Thường dùng cho `POST`.
   */
  CREATED: 201,
  /**
   * Yêu cầu thành công nhưng không có nội dung nào để trả về.
   * Thường dùng cho `DELETE`.
   */
  NO_CONTENT: 204,

  // === 4xx: Client Error ===
  /**
   * Yêu cầu không thể được xử lý do cú pháp không hợp lệ (lỗi validation, thiếu body...).
   */
  BAD_REQUEST: 400,
  /**
   * Yêu cầu yêu cầu xác thực. Client chưa cung cấp token hoặc token không hợp lệ.
   */
  UNAUTHORIZED: 401,
  /**
   * Client đã được xác thực (đã đăng nhập) nhưng không có quyền truy cập vào tài nguyên này.
   */
  FORBIDDEN: 403,
  /**
   * Tài nguyên được yêu cầu không tìm thấy trên máy chủ.
   */
  NOT_FOUND: 404,
  /**
   * Yêu cầu không thể hoàn thành do xung đột với trạng thái hiện tại của tài nguyên.
   * Ví dụ: Tạo email đã tồn tại.
   */
  CONFLICT: 409,
  /**
   * MỚI: Yêu cầu có cú pháp đúng, nhưng không thể xử lý được do lỗi logic nghiệp vụ.
   * Ví dụ: Client gửi 10 trường, nhưng 2 trường trong đó (như `email` hoặc `password`) không qua được validation (sai định dạng, quá ngắn/dài...).
   */
  UNPROCESSABLE_ENTITY: 422,

  // === 5xx: Server Error ===
  /**
   * Một lỗi chung đã xảy ra trên máy chủ mà không lường trước được.
   */
  INTERNAL_SERVER_ERROR: 500,
  /**
   * Máy chủ hiện không khả dụng (do quá tải hoặc bảo trì).
   */
  SERVICE_UNAVAILABLE: 503
}

export default HTTP_STATUS
