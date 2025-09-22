import {buyerSchema} from "../../schemaValidation/buyerValidation.js"
import { Buyer, BusinessOwner } from "../../model/index.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";

// 1. Add Buyer
export const addBuyer = asyncHandler(async (req, res) => {
  const parsedData = buyerSchema.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((i) => i.message);
    return errorResponse(res, 400, errors.join(", "));
  }

   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }

  const { ownerId, registrationNumber, contactEmail } = parsedData.data;

  // Ensure owner exists
  const owner = await BusinessOwner.findByPk(ownerId);
  if (!owner) {
    return errorResponse(res, 404, "Business owner not found");
  }

  // Ensure registration number is unique if provided
  if (registrationNumber) {
    const existingReg = await Buyer.findOne({ where: { registrationNumber } });
    if (existingReg) {
      return errorResponse(res, 409, "Registration number already in use");
    }
  }

  // Ensure contact email is unique
  const existingEmail = await Buyer.findOne({ where: { contactEmail } });
  if (existingEmail) {
    return errorResponse(res, 409, "Contact email already in use");
  }

  const newBuyer = await Buyer.create({
    ...parsedData.data,
    isVerified: true,
  });

  return successResponse(res, 201, "Buyer added successfully", newBuyer);
});

// 2. Soft Delete Buyer
export const deleteBuyer = asyncHandler(async (req, res) => {
   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }
  const  buyerId  = req.params.id;

  const buyer = await Buyer.findByPk(buyerId);
  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found");
  }
  await buyer.update({ status: "inactive", isDeleted: true });
  await buyer.destroy(); // 👈 Soft delete (thanks to paranoid: true)

  return successResponse(res, 200, "Buyer deleted successfully");
});

// 3. Activate Buyer
export const activateBuyer = asyncHandler(async (req, res) => {
   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }
  const  id  = req.params.id;

  const buyer = await Buyer.findByPk(id);
  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found");
  }

  await buyer.update({ status: "active", isDeleted: false });

  return successResponse(res, 200, "Buyer activated successfully", buyer);
});

// 4. Deactivate Buyer
export const deactivateBuyer = asyncHandler(async (req, res) => {
   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }
  const  id  = req.params.id;

  const buyer = await Buyer.findByPk(id);
  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found");
  }

  await buyer.update({ status: "inactive", isDeleted: false });

  return successResponse(res, 200, "Buyer deactivated successfully", buyer);
});

export const editBuyer = asyncHandler(async (req, res) => {
   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }
  const  id  = req.params.id;

  // Validate partial input
  const parsedData = buyerSchema.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((i) => i.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  const updates = parsedData.data;

  // Find buyer
  const buyer = await Buyer.findByPk(id);
  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found");
  }

  // Ensure registration number uniqueness if updating
  if (updates.registrationNumber) {
    const existingReg = await Buyer.findOne({
      where: { registrationNumber: updates.registrationNumber },
    });
    if (existingReg && existingReg.id !== buyer.id) {
      return errorResponse(res, 409, "Registration number already in use");
    }
  }

  // Ensure contact email uniqueness if updating
  if (updates.contactEmail) {
    const existingEmail = await Buyer.findOne({
      where: { contactEmail: updates.contactEmail },
    });
    if (existingEmail && existingEmail.id !== buyer.id) {
      return errorResponse(res, 409, "Contact email already in use");
    }
  }

  // Update buyer
  await buyer.update(updates);

  return successResponse(res, 200, "Buyer updated successfully", buyer);
});