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
  INVALID_MONGODB_ID_FORMAT: "The provided ID is not a valid MongoDB ObjectId format.",
  REGENERATE_QR_TOKEN_SUCCESS: "QR token regenerated successfully.",

  //supplier
  SUPPLIER_NAME_REQUIRED: "Supplier name is required.",
  SUPPLIER_NAME_INVALID: "Supplier name must be a string.",
  SUPPLIER_TAX_CODE_REQUIRED: "Tax code is required.",
  SUPPLIER_TAX_CODE_INVALID: "Tax code must contain only letters and numbers.",
  SUPPLIER_TAX_CODE_LENGTH_INVALID: "Tax code must be between 5 and 20 characters long.",
  SUPPLIER_STATUS_REQUIRED: "Supplier status is required.",
  SUPPLIER_STATUS_INVALID: "Supplier status must be one of: active, inactive",
  SUPPLIER_CONTACT_PERSON_REQUIRED: "Contact person name is required.",
  SUPPLIER_CONTACT_PERSON_INVALID: "Contact person name must be a string.",
  SUPPLIER_PHONE_REQUIRED: "Phone number is required.",
  SUPPLIER_PHONE_INVALID: "Invalid phone number format.",
  SUPPLIER_EMAIL_INVALID: "Invalid email address.",
  SUPPLIER_ADDRESS_REQUIRED: "Address is required.",
  SUPPLIER_ADDRESS_INVALID: "Address must be a string.",

  CREATE_SUPPLIER_SUCCESS: "Supplier created successfully.",
  SUPPLIER_UPDATE_SUCCESS: "Supplier updated successfully.",
  GET_ALL_SUPPLIERS_SUCCESS: "GET ALL SUPPLIERS SUCCESS",

  // Category
  CATEGORY_NAME_REQUIRED: "Category name is required.",
  CATEGORY_NAME_INVALID: "Category name must be a string.",
  CATEGORY_NAME_LENGTH: "Category name must be between 1 and 50 characters.",
  CATEGORY_DESCRIPTION_REQUIRED: "Category description is required.",
  CATEGORY_DESCRIPTION_INVALID: "Category description must be a string.",
  CATEGORY_DESCRIPTION_LENGTH: "Category description cannot exceed 255 characters.",
  CATEGORY_STATUS_REQUIRED: "Category status is required.",
  CATEGORY_STATUS_INVALID: "Category status must be either 'active' or 'inactive'.",
  CREATE_CATEGORY_SUCCESS: "Category created successfully.",
  UPDATE_CATEGORY_SUCCESS: "Category updated successfully.",

  // Messages for Ingredients
  INGREDIENT_NAME_IS_REQUIRED: "Ingredient name is required",
  INGREDIENT_NAME_MUST_BE_STRING: "Ingredient name must be a string",
  INGREDIENT_NAME_MIN_LENGTH: "Ingredient name must be at least 2 characters long",
  CATEGORY_ID_IS_REQUIRED: "Category name is required",
  CATEGORY_ID_INVALID: "Invalid Category ID (must be a MongoID)",
  UNIT_IS_REQUIRED: "Unit is required",
  UNIT_MUST_BE_STRING: "Unit must be a string",
  UNIT_PRICE_IS_REQUIRED: "Unit price is required",
  UNIT_PRICE_MUST_BE_POSITIVE: "Unit price must be a number greater than 0",
  MIN_STOCK_IS_REQUIRED: "Minimum stock is required",
  MIN_STOCK_MUST_BE_POSITIVE_INTEGER: "Minimum stock must be an integer greater than or equal to 0",
  // Ingredient Success Messages
  INGREDIENT_CREATED_SUCCESSFULLY: "Ingredient created successfully",
  INGREDIENT_UPDATED_SUCCESSFULLY: "Ingredient updated successfully",

  // New Messages for Roles
  ROLE_ID_IS_REQUIRED: "Role ID is required.",
  ROLE_NAME_REQUIRED: "Role name is required.",
  ROLE_NAME_MUST_BE_STRING: "Role name must be a string.",
  ROLE_DESCRIPTION_MUST_BE_STRING: "Role description must be a string.",
  ROLE_STATUS_REQUIRED: "Role status is required.",
  INVALID_ROLE_STATUS: "Invalid role status.", // (You can add valid statuses here, e.g., "Status must be 'active' or 'inactive'")
  ROLE_PERMISSION_IDS_REQUIRED: "Permission IDs are required.",
  ROLE_PERMISSION_IDS_MUST_BE_ARRAY: "Permission IDs must be an array.",
  ROLE_NAME_ALREADY_EXISTS: "Role name already exists",
  GET_ALL_ROLES_SUCCESS: "Get all roles successfully.",
  CREATE_ROLE_SUCCESS: "Create role successfully.",
  UPDATE_ROLE_SUCCESS: "Update role successfully.",
  ROLE_NOT_FOUND: "Role not found.",

  // New Messages for Permissions
  PERMISSION_ID_IS_REQUIRED: "Permission ID is required.",
  PERMISSION_NAME_REQUIRED: "Permission name is required.",
  PERMISSION_NAME_MUST_BE_STRING: "Permission name must be a string.",
  PERMISSION_DESCRIPTION_MUST_BE_STRING: "Permission description must be a string.",
  PERMISSION_MODULE_MUST_BE_STRING: "Permission module must be a string.",
  PERMISSION_NAME_ALREADY_EXISTS: "Permission name already exists.",
  GET_ALL_PERMISSIONS_SUCCESS: "Get all permissions success",
  UPDATE_PERMISSION_SUCCESS: "Update permission successfully.",
  PERMISSION_NOT_FOUND: "Permission not found.",
  DELETE_PERMISSION_SUCCESS: "Delete permission successfully.",
  PERMISSION_ID_NOT_FOUND: "One or more permission IDs do not exist."
}

export default USER_MESSAGES
