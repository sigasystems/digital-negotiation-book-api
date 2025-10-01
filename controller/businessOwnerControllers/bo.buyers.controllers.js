import {buyerSchema} from "../../schemaValidation/buyerValidation.js"
import { businessOwnerSchema } from "../../schemaValidation/businessValidation.js";
import buyerService from "../../services/buyer.service.js";
import boBuyersRepository from "../../repositories/bo.buyers.repository.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";

export const becomeBusinessOwner = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existingUser = await boBuyersRepository.findUserByEmail(email);
  if (!existingUser) return errorResponse(res, 404, "User not found in the system");

  const parsed = businessOwnerSchema.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, 400, parsed.error.issues.map(i => i.message).join(", "));
  }

  const { newOwner, accessToken } = await buyerService.becomeBusinessOwner(email, { ...parsed.data, res }, existingUser);

  return successResponse(res, 201, "Business owner created successfully!", {
    accessToken,
    id: newOwner.id,
    first_name: newOwner.first_name,
    last_name: newOwner.last_name,
    email: newOwner.email,
    businessName: newOwner.businessName,
    registrationNumber: newOwner.registrationNumber,
    status: newOwner.status,
    createdAt: newOwner.createdAt,
  });
});

// Get all buyers
export const getAllBuyers = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);
  const buyers = await buyerService.getAllBuyers(req.user.id);
  return successResponse(res, 200, "Buyers fetched successfully", buyers);
});

// Get buyer by ID
export const getBuyerById = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);
  const buyer = await buyerService.getBuyerById(req.user.id, req.params.id);
  return successResponse(res, 200, "Buyer fetched successfully", buyer);
});

// Search buyers
export const searchBuyers = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const { country, status, isVerified } = req.query;
  const parsed = buyerSearchSchemaValidation
    .pick({ country: true, status: true, isVerified: true })
    .safeParse({ country, status, isVerified: isVerified ? isVerified === "true" : undefined });

  if (!parsed.success) {
    return errorResponse(res, 400, parsed.error.issues.map(i => i.message).join(", "));
  }

  const buyers = await buyerService.searchBuyers(req.user.id, parsed.data);
  return successResponse(res, 200, buyers.length ? "Buyers filtered successfully" : "No buyers found", buyers);
});

export const addBuyer = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const parsed = buyerSchema.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, 400, parsed.error.issues.map(i => i.message).join(", "));
  }

  const owner = await boBuyersRepository.findOwnerById(req.user.id);
  if (!owner) return errorResponse(res, 404, "Business owner not found");

  const newBuyer = await buyerService.addBuyer(req.user.id, parsed.data, owner);
  return successResponse(res, 201, "Buyer added successfully", newBuyer);
});

export const deleteBuyer = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const buyer = await boBuyersRepository.findById(req.params.id);
  if (!buyer) return errorResponse(res, 404, "Buyer not found");

  const owner = await boBuyersRepository.findOwnerById(buyer.ownerId);
  await buyerService.deleteBuyer(buyer, owner);

  return successResponse(res, 200, "Buyer deleted successfully");
});

export const activateBuyer = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const buyer = await boBuyersRepository.findById(req.params.id);
  if (!buyer) return errorResponse(res, 404, "Buyer not found");

  const owner = await boBuyersRepository.findOwnerById(buyer.ownerId);
  const updated = await buyerService.activateBuyer(buyer, owner);

  return successResponse(res, 200, "Buyer activated successfully", updated);
});

export const deactivateBuyer = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const buyer = await boBuyersRepository.findById(req.params.id);
  if (!buyer) return errorResponse(res, 404, "Buyer not found");

  const owner = await boBuyersRepository.findOwnerById(buyer.ownerId);
  const updated = await buyerService.deactivateBuyer(buyer, owner);

  return successResponse(res, 200, "Buyer deactivated successfully", updated);
});

export const editBuyer = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const parsed = buyerSchema.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, 400, parsed.error.issues.map(i => i.message).join(", "));
  }

  const buyer = await boBuyersRepository.findById(req.params.id);
  if (!buyer) return errorResponse(res, 404, "Buyer not found");

  const owner = await boBuyersRepository.findOwnerById(buyer.ownerId);
  const updated = await buyerService.editBuyer(buyer, parsed.data, owner);

  return successResponse(res, 200, "Buyer updated successfully", updated);
});
