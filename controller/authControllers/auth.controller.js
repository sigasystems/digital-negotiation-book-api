import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../model/user/user.model.js";
import { registerSchemaValidation , loginSchemaValidation } from "../../schemaValidation/authValidation.js";
import { refreshTokenGenerator , accessTokenGenerator } from "../../utlis/tokenGenerator.js";

// Controller to register a new user
export const register = asyncHandler(async (req, res) => {
  // 1. Validate input using Zod
  const parsedData = registerSchemaValidation.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((issue) => issue.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  const { first_name, last_name, company_name, email, country_code, phone_number, password } =
    parsedData.data;

  // 2. Check for duplicates
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return errorResponse(res, 409, "User already exists. Kindly login.");
  }

  const existingPhone = await User.findOne({ where: { country_code, phone_number } });
  if (existingPhone) {
    return errorResponse(res, 409, "Phone number already registered.");
  }

  // 3. Hash password securely
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // 4. Store in DB
  const user = await User.create({
    first_name,
    last_name,
    company_name,
    email,
    country_code,
    phone_number,
    password_hash,
  });

  // 5. Respond safely
  return successResponse(res, 201, "User registered successfully!", {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    company_name: user.company_name,
    email: user.email,
    country_code: user.country_code,
    phone_number: user.phone_number,
    created_at: user.created_at,
  });
});

export const login = asyncHandler(async (req, res) => {
  // 1. Validate input
  const parsedData = loginSchemaValidation.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((issue) => issue.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  const { email, password } = parsedData.data;

  // 2. Find user
  let user = await User.findOne({ where: { email } });

  // 3. If user doesn't exist, create one automatically
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      email,
      password_hash: hashedPassword,
    });
  } else {
    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid email or password");
    }
  }

  // 5. Create tokens
  const payload = { id: user.id, email: user.email };
  const accessToken = accessTokenGenerator(payload);
  refreshTokenGenerator(res, payload);

  // 6. Respond with access token and user info
  return successResponse(res, 200, "Login successful!", {
    accessToken
  });
});

export const refreshTokenRotation = asyncHandler(async (req, res) => {
  // 1. Get refresh token from cookie
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return errorResponse(res, 401, "Something went wrong. Please login again.");
  }

  try {
    // 2. Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // 3. Find user in DB
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      return errorResponse(res, 401, "Something went wrong. Please login again.");
    }

    // 4. Generate new access token
    const payload = { id: user.id, email: user.email };
    const accessToken = accessTokenGenerator(payload)

    // 5. Optionally rotate refresh token (more secure)
    refreshTokenGenerator(res, payload)

    // 6. Return new access token
    return successResponse(res, 200, "Access token refreshed successfully!", {
      accessToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return errorResponse(res, 401, "Something went wrong. Please login again.");
  }
});