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
  USER_NOT_VERIFY: "Your account has not been verified.",

  // (You can use this message for the Register route to notify the user)
  REGISTER_SUCCESS_PENDING_VERIFICATION: "Registration successful. Please check your email to verify your account.",

  // === Forgot/Reset Password ===
  FORGOT_PASSWORD_INSTRUCTIONS_SENT:
    "If an account with that email exists, we have sent instructions to reset your password. Please check your inbox (and spam folder) to complete the process.",
  EMAIL_NOT_FOUND: "This email is not registered in our system.",
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: "Forgot password token is required.",
  FORFOT_PASSWORD_TOKEN_INVALID: "Forgot password token is invalid or has expired.",
  RESET_PASSWORD_SUCCESS: "Your password has been reset successfully. You can now login with your new password.",
  VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: "Verify forgot password token success",

  GET_MY_PROFILE_SUCCESS: "Get my profile success",

  AVATAR_URL_MUST_BE_STRING: "Avatar URL must be a string",
  AVATAR_URL_LENGTH: "Avatar URL must be between 1 and 500 characters long",
  UPDATE_INFOR_SUCCESS: "Update infor success",

  // === Change Password ===
  CHANGE_PASSWORD_SUCCESS: "Your password has been changed successfully.",
  OLD_PASSWORD_IS_REQUIRED: "Old password is required.",
  NEW_PASSWORD_IS_REQUIRED: "New password is required.",
  CONFIRM_NEW_PASSWORD_IS_REQUIRED: "Confirm new password is required.",
  OLD_PASSWORD_IS_INCORRECT: "Your old password is not correct.",
  NEW_PASSWORD_AND_CONFIRM_PASSWORD_DO_NOT_MATCH: "New password and confirmation password do not match.",
  NEW_PASSWORD_CANNOT_BE_THE_SAME_AS_OLD_PASSWORD: "Your new password cannot be the same as your old password.",

  CAPACITY_REQUIRED: "Capacity is required.",
  CAPACITY_MUST_BE_POSITIVE_INTEGER: "Capacity must be a positive integer.",
  GET_ALL_TABLES_SUCCESS: "Get all tables successfully.",
  UPDATE_TABLE_SUCCESS: "Table updated successfully.",
  CREATE_TABLE_SUCCESS: "Table created successfully.",
  DELETE_TABLE_SUCCESS: "Table deleted successfully.",

  ID_IS_REQUIRED: "ID cannot be empty.",
  INVALID_MONGODB_ID_FORMAT: "The provided ID is not a valid MongoDB ObjectId format."
}

export default USER_MESSAGES
