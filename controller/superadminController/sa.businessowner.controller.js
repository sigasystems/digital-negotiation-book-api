import bcrypt from "bcrypt";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { BusinessOwner, Buyer } from "../../model/index.js";
import { businessOwnerSchema } from "../../schemaValidation/businessValidation.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";
import { formatDate } from "../../utlis/dateFormatter.js";

// Recursive function to format all Date fields in an object/array
const formatTimestamps = (obj) => {
  if (!obj) return obj;
  if (obj instanceof Date) return formatDate(obj);

  if (Array.isArray(obj)) {
    return obj.map(formatTimestamps);
  }

  if (typeof obj === "object") {
    const formatted = { ...obj };
    Object.keys(formatted).forEach((key) => {
      if (formatted[key] instanceof Date) {
        formatted[key] = formatDate(formatted[key]);
      } else if (Array.isArray(formatted[key])) {
        formatted[key] = formatted[key].map(formatTimestamps);
      } else if (typeof formatted[key] === "object" && formatted[key] !== null) {
        formatted[key] = formatTimestamps(formatted[key]);
      }
    });
    return formatted;
  }

  return obj;
};

// ------------------ SUPER ADMIN CONTROLLERS ------------------

// Create a new Business Owner
export const createBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const parsedData = businessOwnerSchema.safeParse(req.body);
    if (!parsedData.success) {
      const errors = parsedData.error.issues.map((e) => e.message);
      return errorResponse(res, 400, errors.join(", "));
    }

    const owner = await BusinessOwner.create(parsedData.data);
    const formattedOwner = formatTimestamps(owner.toJSON());

    return successResponse(res, 201, "Business owner created successfully", formattedOwner);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Get all Business Owners (with optional buyers)
export const getAllBusinessOwners = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const { withBuyers } = req.query;
    let owners;

    if (withBuyers === "true") {
      owners = await BusinessOwner.findAll({
        include: [{ model: Buyer, as: "buyers" }],
      });
    } else {
      owners = await BusinessOwner.findAll();
    }

    const ownersJSON = owners.map((owner) => owner.toJSON());
    const formattedOwners = ownersJSON.map(formatTimestamps);

    return successResponse(res, 200, "Business owners fetched successfully", {
      totalOwners: formattedOwners.length,
      owners: formattedOwners,
    });
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Get Business Owner by ID
export const getBusinessOwnerById = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id, { paranoid: false });
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    return successResponse(res, 200, "Business owner fetched successfully", owner);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Update Business Owner
export const updateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const parsedData = businessOwnerSchema.safeParse(req.body);
    if (!parsedData.success) {
      const errors = parsedData.error.issues.map((e) => e.message);
      return errorResponse(res, 400, errors.join(", "));
    }

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    await owner.update(parsedData.data);
    return successResponse(res, 200, "Business owner updated successfully", owner);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Activate Business Owner
export const activateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    owner.status = "active";
    owner.is_deleted = false;
    await owner.save();

    return successResponse(res, 200, "Business owner activated successfully", owner);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Deactivate Business Owner
export const deactivateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    owner.status = "inactive";
    owner.is_deleted = true;
    await owner.save();

    return successResponse(res, 200, "Business owner deactivated successfully", owner);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Approve Business Owner
export const approveBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    owner.is_approved = true;
    await owner.save();

    return successResponse(res, 200, "Business owner approved successfully", owner);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Reject Business Owner
export const rejectBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    owner.is_approved = false;
    await owner.save();

    return successResponse(res, 200, "Business owner rejected successfully", { owner });
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});
