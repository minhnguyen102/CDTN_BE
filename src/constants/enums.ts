export enum AccountVerifyStatus {
  UNVERIFIED = "unverified", // chưa xác thực (Mặc định)
  VERIFIED = "verified", // Đã xác thực
  BANNER = "banner" // Bị khóa (Đối với nhân viên được cho thôi hoặc nghỉ việc)
}

export enum TokenType {
  ACCESS_TOKEN = "access_token",
  REFRESH_TOKEN = "refresh_token",
  EMAIL_VERIFY_TOKEN = "email_verify_token",
  FORGOT_PASSWORD_TOKEN = "forgot_password_token"
}

export enum TableStatus {
  AVAILABLE = "available", // còn trống
  OCCUPIED = "occupied", // đã có khách
  RESERVED = "reserved", // đã đặt trước
  NEEDS_CLEANING = "needs_cleaning" // cần dọn dẹp
} // done

export enum SupplierStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
} // done

export enum CategoryTypeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
} // done

export enum RoleStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

export enum ImportOrderStatus {
  CONFIRMED = "confirmed",
  DRAFT = "draft"
}

export enum DishStatus {
  AVAILABLE = "available",
  UNAVAILABLE = "unavailable",
  HIDDEN = "hidden"
}

export enum DishCategoryStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

export const MESSAGE_CODES = {
  EMAIL_TOKEN_EXPIRED: "EMAIL_TOKEN_EXPIRED",
  EMAIL_ALREADY_VERIFIED: "EMAIL_ALREADY_VERIFIED",
  INVALID_TOKEN: "INVALID_TOKEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RESEND_VERIFY_EMAIL_SUCCESS: "RESEND_VERIFY_EMAIL_SUCCESS",
  VERIFY_SUCCESS: "VERIFY_SUCCESS",

  FORGOT_PASSWORD_TOKEN_EXPIRED: "FORGOT_PASSWORD_TOKEN_EXPIRED",
  FORGOT_PASSWORD_TOKEN_INVALID: "FORGOT_PASSWORD_TOKEN_INVALID"
}

//Trạng thái cho từng món ăn lẻ (để track món nào ra rồi, món nào chưa)
export enum OrderItemStatus {
  Pending = "Pending", // Chờ nấu
  Cooking = "Cooking", // Đang nấu
  Served = "Served", // Đã phục vụ
  Reject = "Reject" // Từ chối
}

export enum PaymentStatus {
  UNPAID = "Unpaid",
  PAID = "Paid",
  FAILED = "Failed" // Dùng cho trường hợp SePay báo lỗi hoặc giao dịch thất bại
}

export enum PaymentMethod {
  CASH = "Cash",
  BANK = "Bank"
}

export const ROLE_GUEST = "Guest"

export enum ReviewStatus {
  ACTIVE = "Active",
  HIDDEN = "Hidden"
}

export enum BookingStatus {
  PENDING = "Pending",
  CONFIRMED = "Confirmed",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  NO_SHOW = "No_show"
}
