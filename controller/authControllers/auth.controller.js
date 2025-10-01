import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import authService from "../../services/auth.service.js";
import { registerSchemaValidation, loginSchemaValidation } from "../../schemaValidation/authValidation.js";

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchemaValidation.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, 400, parsed.error.issues.map(i => i.message).join(", "));

  const user = await authService.register(parsed.data);
  return successResponse(res, 201, "User registered", user);
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchemaValidation.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, 400, parsed.error.issues.map(i => i.message).join(", "));

  const { accessToken, roleDetails } = await authService.login(parsed.data);
  return successResponse(res, 200, "Login successful", {
    accessToken,
    roleCreatedAt: roleDetails?.createdAt,
    roleUpdatedAt: roleDetails?.updatedAt,
    roleIsActive: roleDetails?.isActive ?? false,
  });
});

export const refreshTokenRotation = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return errorResponse(res, 401, "No refresh token");

  const accessToken = await authService.refreshToken(token, res);
  return successResponse(res, 200, "Access token refreshed", { accessToken });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return errorResponse(res, 400, "Email is required");

  await authService.requestPasswordReset(email);
  return successResponse(res, 200, "If registered, an OTP has been sent.");
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) return errorResponse(res, 400, "All fields required");

  await authService.resetPasswordWithOtp({ email, otp, password });
  return successResponse(res, 200, "Password reset successful.");
});
