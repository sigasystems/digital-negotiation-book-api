import { BusinessOwner, Buyer } from "../../model/index.js";
import { businessOwnerSchema } from "../../schemaValidation/businessValidation.js";
import {
  successResponse,
  errorResponse,
} from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { formatDate } from "../../utlis/dateFormatter.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";

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
      } else if (
        typeof formatted[key] === "object" &&
        formatted[key] !== null
      ) {
        formatted[key] = formatTimestamps(formatted[key]);
      }
    });
    return formatted;
  }

  return obj;
};

// ------------------ CONTROLLERS ------------------

// Create a new Business Owner (super_admin only)
export const createBusinessOwner = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["super_admin"]);

  try {
    const validatedData = businessOwnerSchema.parse(req.body);
    const owner = await BusinessOwner.create(validatedData);

    const formattedOwner = formatTimestamps(owner.toJSON());
    return successResponse(
      res,
      201,
      "Business owner created successfully",
      formattedOwner
    );
  } catch (error) {
    return errorResponse(
      res,
      400,
      "Validation failed",
      error.errors ? error.errors.map((e) => e.message) : error.message
    );
  }
});

// Get all Business Owners (?withBuyers=true) (super_admin only)
export const getAllBusinessOwners = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["super_admin"]);

  try {
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
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to fetch business owners",
      error.message
    );
  }
});

// Get Business Owner by ID (super_admin only)
export const getBusinessOwnerById = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["super_admin"]);

  try {
    const owner = await BusinessOwner.findByPk(req.params.id, {
      paranoid: false,
    });
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    return successResponse(
      res,
      200,
      "Business owner fetched successfully",
      owner
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to fetch business owner",
      error.message
    );
  }
});

// Update Business Owner (super_admin only)
export const updateBusinessOwner = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["super_admin"]);

  try {
    const validatedData = businessOwnerSchema.parse(req.body);
    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    await owner.update(validatedData);
    return successResponse(
      res,
      200,
      "Business owner updated successfully",
      owner
    );
  } catch (error) {
    return errorResponse(
      res,
      400,
      "Failed to update business owner",
      error.issues ? error.issues.map((e) => e.message) : error.message
    );
  }
});

// Activate Business Owner (super_admin only)
export const activateBusinessOwner = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["super_admin"]);

  try {
    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    owner.status = "active";
    owner.is_deleted = false;
    await owner.save();

    return successResponse(
      res,
      200,
      "Business owner activated successfully",
      owner
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to activate business owner",
      error.message
    );
  }
});

// Deactivate Business Owner (super_admin only)
export const deactivateBusinessOwner = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["super_admin"]);

  try {
    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    owner.status = "inactive";
    owner.is_deleted = true;
    await owner.save();

    return successResponse(
      res,
      200,
      "Business owner deactivated successfully",
      owner
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to deactivate business owner",
      error.message
    );
  }
});

// Approve Business Owner (super_admin only)
export const approveBusinessOwner = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["super_admin"]);

  try {
    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    owner.is_approved = true;
    await owner.save();

    return successResponse(
      res,
      200,
      "Business owner approved successfully",
      owner
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to approve business owner",
      error.message
    );
  }
});

// Reject Business Owner (super_admin only)
export const rejectBusinessOwner = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["super_admin"]);

  try {
    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");

    owner.is_approved = false;
    await owner.save();

    return successResponse(res, 200, "Business owner rejected successfully", {
      owner,
    });
  } catch (error) {
    return errorResponse(
      res,
      400,
      "Failed to reject business owner",
      error.errors ? error.errors.map((e) => e.message) : error.message
    );
  }
});
