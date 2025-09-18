import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import bcrypt from "bcrypt";
import User from "../../model/user/user.model.js";
import { registerSchemaValidation } from "../../schemaValidation/authValidation.js";

// Controller to register a new user
export const registerUser = asyncHandler(async (req, res) => {
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
