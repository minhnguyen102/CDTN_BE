export enum RoleAccount {
  Employee, // tương ứng = 0
  Owner
}

export enum AccountVerifyStatus {
  Unverified, // chưa xác thực (Mặc định)
  Verified, // Đã xác thực
  Banner // Bị khóa (Đối với nhân viên được cho thôi hoặc nghỉ việc)
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  EmailVerifyToken,
  ForgotPasswordToken
}
