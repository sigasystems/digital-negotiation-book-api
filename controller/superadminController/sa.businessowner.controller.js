import { BusinessOwner } from "../../model/index.js";
import { businessOwnerSchema } from "../../schemaValidation/businessValidation.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";

// Create a new Business Owner
export const createBusinessOwner = asyncHandler(async (req, res) => {
  try {
    const validatedData = businessOwnerSchema.parse(req.body);
    const owner = await BusinessOwner.create(validatedData);

    return successResponse(res, 201, "Business owner created successfully", owner);
  } catch (error) {
    return errorResponse(
      res,
      400,
      "Validation failed",
      error.errors ? error.errors.map((e) => e.message) : error.message
    );
  }
});

// Get all Business Owners
export const getAllBusinessOwners = asyncHandler(async (req, res) => {
  try {
    const owners = await BusinessOwner.findAll({ paranoid: false });
    return successResponse(res, 200, "Business owners fetched successfully", owners);
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch business owners", error.message);
  }
});

// Get Business Owner by ID
export const getBusinessOwnerById = asyncHandler(async (req, res) => {
  try {
    const owner = await BusinessOwner.findByPk(req.params.id, { paranoid: false });
    if (!owner) {
      return errorResponse(res, 404, "Business owner not found");
    }
    return successResponse(res, 200, "Business owner fetched successfully", owner);
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch business owner", error.message);
  }
});

// Update Business Owner
export const updateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    const validatedData = businessOwnerSchema.parse(req.body);
    const owner = await BusinessOwner.findByPk(req.params.id);

    if (!owner) {
      return errorResponse(res, 404, "Business owner not found");
    }

    await owner.update(validatedData);
    return successResponse(res, 200, "Business owner updated successfully", owner);
  } catch (error) {
    return errorResponse(
      res,
      400,
      "Failed to update business owner",
      error.issues ? error.issues.map((e) => e.message) : error.message
    );
  }
});

// Soft Delete Business Owner (sets isDeleted = true, status = inactive)
// export const softDeleteBusinessOwner = asyncHandler(async (req, res) => {
//   try {
//     const owner = await BusinessOwner.findByPk(req.params.id);
//     if (!owner) {
//       return errorResponse(res, 404, "Business owner not found");
//     }
//     await owner.update({ isDeleted: true, status: "inactive" });
//     return successResponse(res, 200, "Business owner soft-deleted successfully", owner);
//   } catch (error) {
//     return errorResponse(res, 500, "Failed to soft-delete business owner", error.message);
//   }
// });
// ---------------------------------------------


// Change Status (also activates  if status = active)
export const activateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) {
      return errorResponse(res, 404, "Business owner not found");
    }

    owner.status = "active";
    owner.is_deleted = false; // restore if soft-deleted
    await owner.save();

    return successResponse(res, 200, "Business owner activated successfully", owner);
  } catch (error) {
    return errorResponse(res, 500, "Failed to activate business owner", error.message);
  }
});

export const deactivateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) {
      return errorResponse(res, 404, "Business owner not found");
    }

    owner.status = "inactive";
    owner.is_deleted = true; // soft delete
    await owner.save();

    return successResponse(res, 200, "Business owner deactivated successfully", owner);
  } catch (error) {
    return errorResponse(res, 500, "Failed to deactivate business owner", error.message);
  }
});

// ---------------------------------------------


// Approve Business Owner (sets isAprroved=true)
export const approveBusinessOwner = asyncHandler(async (req, res) => {
  try {
    const owner = await BusinessOwner.findByPk(req.params.id);

    if (!owner) {
      return errorResponse(res, 404, "Business owner not found");
    }

    owner.is_approved = true;
    await owner.save();

    return successResponse(res, 200, "Business owner approved successfully", owner);
  } catch (error) {
    return errorResponse(res, 500, "Failed to approve business owner", error.message);
  }
});

// Reject Business Owner (sets isApproved=false)
export const rejectBusinessOwner = asyncHandler(async (req, res) => {
  try {
    const owner = await BusinessOwner.findByPk(req.params.id);

    if (!owner) {
      return errorResponse(res, 404, "Business owner not found");
    }

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
