const USER_MESSAGES = {
  // === General ===
  VALIDATION_ERROR: "Validation error",
  TOKEN_IS_REQUIRED: "Token is required",
  TOKEN_IS_INVALID: "Token is invalid",
  USER_NOT_FOUND: "User not found",
  ACCESS_DENIED: "Access denied", // 403 Forbidden

  // === Register / Login / Logout ===
  REGISTER_SUCCESS: "Register successfully",
  LOGIN_SUCCESS: "Login successfully",
  LOGOUT_SUCCESS: "Logout successfully",
  EMAIL_ALREADY_EXISTS: "This email already exists",
  EMAIL_OR_PASSWORD_IS_INCORRECT: "Email or password is incorrect",
  EMAIL_AND_PASSWORD_ARE_REQUIRED: "Email and password are required",
  PASSWORD_IS_REQUIRED: "Password is required",
  PASSWORD_MUST_BE_STRING: "Password must be a string",
  PASSWORD_LENGTH: "Password must be between 6 and 50 characters",
  CONFIRM_PASSWORD_IS_REQUIRED: "Confirm password is required",
  CONFIRM_PASSWORD_MUST_BE_STRING: "Confirm password must be a string",
  CONFIRM_PASSWORD_LENGTH: "Confirm password must be between 6 and 50 characters",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
  PASSWORD_MUST_BE_STRONG:
    "Password must be at least 8 characters long, containing at least 1 uppercase letter, 1 lowercase letter, and 1 special symbol.",

  // === User Fields ===
  NAME_IS_REQUIRED: "Name is required",
  NAME_MUST_BE_STRING: "Name must be a string",
  NAME_LENGTH: "Name must be between 1 and 50 characters",

  EMAIL_IS_REQUIRED: "Email is required",
  EMAIL_IS_INVALID: "Invalid email format",
  EMAIL_MUST_BE_STRING: "Email must be a string",

  DATE_OF_BIRTH_MUST_BE_ISO8601: "Date of birth must be in ISO 8601 format",
  DATE_OF_BIRTH_IS_REQUIRED: "Date_of_birth is required",
  IMAGE_IS_INVALID: "Image format is invalid",

  // === Follow ===
  ALREADY_FOLLOWED: "You already followed this user",
  NOT_FOLLOWED_YET: "You have not followed this user",

  ACCESS_TOKEN_IS_REQUIRED: "Access token is required",
  REFRESH_TOKEN_IS_REQUIRED: "Refresh token is required",
  USED_REFRESH_TOKEN_OR_NOT_EXIST: "Used refresh token or not exist",
  REFRESH_TOKEN_IS_INVALID: "Refresh token is invalid",
  REFRESH_TOKEN_SUCCESS: "Refresh token success",
  EMAIL_VERIFY_TOKEN_TOKEN_IS_REQUIRED: "Email verify token is required",
  // === Email Verification ===
  VERIFY_EMAIL_SUCCESS: "Verify email success",
  EMAIL_ALREADY_VERIFIED: "This email has already been verified.",
  ACCOUNT_NOT_VERIFIED: "Your account has not been verified. Please check your email.",
  EMAIL_VERIFICATION_TOKEN_INVALID: "The email verification token is invalid or has expired.",
  RESEND_VERIFY_EMAIL_SUCCESS: "A new verification email has been sent. Please check your inbox.",

  // (You can use this message for the Register route to notify the user)
  REGISTER_SUCCESS_PENDING_VERIFICATION: "Registration successful. Please check your email to verify your account."
}

export default USER_MESSAGES
