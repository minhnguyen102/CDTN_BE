export enum RoleAccount {
  Employee = "Employee", // tương ứng = 0
  Owner = "Owner"
}

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
