import bcrypt from "bcrypt";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import {BusinessOwner, Buyer, User} from "../../model/index.js";
import { businessOwnerSchema } from "../../schemaValidation/businessValidation.js";
import { buyerSchema, buyerSearchSchemaValidation } from "../../schemaValidation/buyerValidation.js";
import { accessTokenGenerator, refreshTokenGenerator } from "../../utlis/tokenGenerator.js";
import { Op } from "sequelize";
import { z } from "zod";

const getBuyerParamsSchema = z.object({
  ownerId: z.string().uuid({ message: "Invalid owner ID" }),
  buyerId: z.string().uuid({ message: "Invalid buyer ID" }),
});


export const becomeBusinessOwner = asyncHandler(async (req, res) => {
  // 1. Get email from authenticated user (comes from token or body)
  const { email } = req.body;

  // 2. Check if user exists in User table
  const existingUser = await User.findOne({ where: { email } });
  if (!existingUser) {
    return errorResponse(res, 404, "User not found in the system");
  }

  // 3. Validate input (excluding email)
  const parsedData = businessOwnerSchema.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((issue) => issue.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  const {
    first_name,
    last_name,
    phoneNumber,
    businessName,
    registrationNumber,
    country,
    state,
    city,
    address,
    postalCode,
  } = parsedData.data;

  // 4. Check for duplicate business owner record for this email
  const existingOwner = await BusinessOwner.findOne({ where: { email } });
  if (existingOwner) {
    return errorResponse(res, 409, "Business owner already registered for this user.");
  }

  // 5. ✅ Check if registration number already exists
  if (registrationNumber) {
    const existingReg = await BusinessOwner.findOne({ where: { registrationNumber } });
    if (existingReg) {
      return errorResponse(res, 409, "Registration number already in use by another business owner.");
    }
  }

  // 6. Update User table with first_name and last_name if provided
  if (first_name || last_name) {
    await existingUser.update({
      first_name: first_name || existingUser.first_name,
      last_name: last_name || existingUser.last_name,
      roleId: 2 || existingUser.roleId
    });
  }

  // 7. Create new business owner using updated user info
  const newOwner = await BusinessOwner.create({
    userId: existingUser.id,
    first_name: existingUser.first_name || first_name,
    last_name: existingUser.last_name || last_name,
    email: existingUser.email,
    phoneNumber,
    businessName,
    registrationNumber,
    country,
    state,
    city,
    address,
    postalCode,
    status: "inactive",
    is_verified: true,
    is_deleted: false,
    is_approved: true,
  });

  const payload = { id: newOwner.id, email: newOwner.email };
  const accessToken = accessTokenGenerator(payload);
  refreshTokenGenerator(res, payload);

  // 8. Respond with success
  return successResponse(res, 201, "Business owner created successfully!", {
    accessToken,
    id: newOwner.id,
    first_name: newOwner.first_name,
    last_name: newOwner.last_name,
    email: newOwner.email,
    phoneNumber: newOwner.phoneNumber,
    businessName: newOwner.businessName,
    businessType: newOwner.businessType,
    registrationNumber: newOwner.registrationNumber,
    country: newOwner.country,
    state: newOwner.state,
    city: newOwner.city,
    address: newOwner.address,
    postalCode: newOwner.postalCode,
    status: newOwner.status,
    isVerified: newOwner.is_verified,
    isDeleted: newOwner.is_deleted,
    isApproved: newOwner.is_approved,
    createdAt: newOwner.createdAt,
  });
});

// 📌 Get all buyers
export const getAllBuyers = asyncHandler(async (req, res) => {
  const  ownerId = req.user.id;

  // Validate ownerId with Zod
  const parsedOwner = buyerSchema.pick({ ownerId: true }).safeParse({ ownerId });
  if (!parsedOwner.success) {
    const errors = parsedOwner.error.issues.map((issue) => issue.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  // Ensure the owner exists
  const owner = await BusinessOwner.findByPk(ownerId);
  if (!owner) {
    return errorResponse(res, 404, "Business Owner not found");
  }

  const buyers = await Buyer.findAll({ where: { ownerId } });

  return successResponse(res, 200, "Buyers fetched successfully", buyers);
});

// 📌 Get buyer by ID
export const getBuyerById = asyncHandler(async (req, res) => {
  const  buyerId  = req.params.id;
  const ownerId = req.user.id

  // Validate params
  const parsedParams = getBuyerParamsSchema.safeParse({ ownerId, buyerId });
  if (!parsedParams.success) {
    const errors = parsedParams.error.issues.map((issue) => issue.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  const buyer = await Buyer.findOne({
    where: { id: buyerId, ownerId },
  });

  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found under this business owner");
  }

  return successResponse(res, 200, "Buyer fetched successfully", buyer);
});

// 📌 Advanced search on buyers
export const searchBuyers = asyncHandler(async (req, res) => {
  const { ownerId } = req.params;
  const { country, status, isVerified } = req.query;

  // Validate query params using partial schema
  const parsedQuery = buyerSearchSchemaValidation
    .pick({ country: true, status: true, isVerified: true })
    .safeParse({ country, status, isVerified: isVerified ? isVerified === "true" : undefined });

  if (!parsedQuery.success) {
    const errors = parsedQuery.error.issues.map((issue) => issue.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  // Build dynamic filters
  const filters = { ownerId };

  if (parsedQuery.data.country) {
    filters.country = { [Op.iLike]: `%${parsedQuery.data.country}%` };
  }

  if (parsedQuery.data.status) {
    filters.status = parsedQuery.data.status;
  }

  if (typeof parsedQuery.data.isVerified !== "undefined") {
    filters.isVerified = parsedQuery.data.isVerified;
  }

  const buyers = await Buyer.findAll({ where: filters });

  const message = buyers?.length > 0 ? "Buyers filtered successfully" : "No buyer is registered with selected filters."

  return successResponse(res, 200, message, buyers);
});