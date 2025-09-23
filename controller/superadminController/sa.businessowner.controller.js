import bcrypt from "bcrypt";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { BusinessOwner, Buyer } from "../../model/index.js";
import { businessOwnerSchema } from "../../schemaValidation/businessValidation.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";
import formatTimestamps from "../../utlis/formatTimestamps.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// ------------------ SUPER ADMIN CONTROLLERS ------------------

// Create a new Business Owner
export const createBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const parsedData = businessOwnerSchema.safeParse(req.body);
    if (!parsedData.success) {
      const errors = parsedData.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return errorResponse(res, 400, "Validation Error", errors);
    }
    const { phoneNumber } = parsedData.data;
    const phoneObj = parsePhoneNumberFromString(phoneNumber);
    if (!phoneObj || !phoneObj.isValid()) {
      return errorResponse(res, 400, "Invalid mobile number format.");
    }

    const normalizedPhone = phoneObj.number;

    const existingOwner = await BusinessOwner.findOne({ where: { phoneNumber: normalizedPhone } });
    if (existingOwner) {
      return errorResponse(res, 400, "Mobile number already exists. Please use a different one.");
    }

    const owner = await BusinessOwner.create({ ...parsedData.data, phoneNumber: normalizedPhone });
    return successResponse(res, 201, "Business owner created successfully", formatTimestamps(owner.toJSON()));
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

    const formattedOwners = owners.map((owner) => formatTimestamps(owner.toJSON()));

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
    if (owner.is_deleted) return errorResponse(res, 400, "Business owner has been deleted.");

    return successResponse(res, 200, "Business owner fetched successfully", formatTimestamps(owner.toJSON()));
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
      const errors = parsedData.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return errorResponse(res, 400, "Validation Error", errors);
    }

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Cannot update a deleted business owner");

    const { mobile } = parsedData.data;
    if (mobile) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobile)) {
        return errorResponse(res, 400, "Invalid mobile number format. Must be exactly 10 digits.");
      }

      const existingOwner = await BusinessOwner.findOne({ where: { mobile } });
      if (existingOwner && existingOwner.id !== req.params.id) {
        return errorResponse(res, 400, "Mobile number already exists. Please use a different one.");
      }
    }

    await owner.update(parsedData.data);
    return successResponse(res, 200, "Business owner updated successfully", formatTimestamps(owner.toJSON()));
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
    if (owner.is_deleted) return errorResponse(res, 400, "Cannot activate a deleted business owner");
    if (owner.status === "active") return errorResponse(res, 400, "Business owner is already active");

    owner.status = "active";
    owner.is_approved = true;
    await owner.save();

    return successResponse(res, 200, "Business owner activated successfully", formatTimestamps(owner.toJSON()));
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
    if (owner.is_deleted) return errorResponse(res, 400, "Cannot deactivate a deleted business owner");
    if (owner.status === "inactive") return errorResponse(res, 400, "Business owner is already inactive");

    owner.status = "inactive";
    await owner.save();

    const responseData = {
      id: owner.id,
      name: owner.name,
      mobile: owner.mobile,
      status: owner.status,
    };
    return successResponse(res, 200, "Business owner deactivated successfully", responseData);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Soft Delete Business Owner
export const softDeleteBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Business owner is already deleted.");

    owner.is_deleted = true;
    owner.status = "inactive";
    await owner.save();

    return successResponse(res, 200, "Business owner soft-deleted successfully", {
      id: owner.id,
      name: owner.name,
      mobile: owner.mobile,
      status: owner.status,
      is_deleted: owner.is_deleted,
    });
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Review Business Owner (Approve or Reject)
export const reviewBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const { id } = req.params;
    const { action } = req.query; // ?action=approve OR ?action=reject

    if (!["approve", "reject"].includes(action)) {
      return errorResponse(res, 400, "Invalid action. Use 'approve' or 'reject'.");
    }

    const owner = await BusinessOwner.findByPk(id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Cannot approve/reject a deleted business owner");

    if (owner.is_approved && action === "approve") {
      return errorResponse(res, 400, "Business owner is already approved");
    }

    if (owner.is_approved === false && action === "reject") {
      return errorResponse(res, 400, "Business owner is already rejected");
    }

    owner.is_approved = action === "approve";
    await owner.save();

    const message = action === "approve"
      ? "Business owner approved successfully"
      : "Business owner rejected successfully";

    const responseData = action === "approve"
      ? formatTimestamps(owner.toJSON())
      : { id: owner.id, first_name: owner.first_name, last_name: owner.last_name, is_approved: owner.is_approved };

    return successResponse(res, 200, message, responseData);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});


// Approve Business Owner
// export const approveBusinessOwner = asyncHandler(async (req, res) => {
//   try {
//     authorizeRoles(req, ["super_admin"]);

//     const owner = await BusinessOwner.findByPk(req.params.id);
//     if (!owner) return errorResponse(res, 404, "Business owner not found");

//     owner.is_approved = true;
//     await owner.save();

//     return successResponse(res, 200, "Business owner approved successfully", formatTimestamps(owner.toJSON()));
//   } catch (err) {
//     return errorResponse(res, err.statusCode || 500, err.message);
//   }
// });

// // Reject Business Owner
// export const rejectBusinessOwner = asyncHandler(async (req, res) => {
//   try {
//     authorizeRoles(req, ["super_admin"]);

//     const owner = await BusinessOwner.findByPk(req.params.id);
//     if (!owner) return errorResponse(res, 404, "Business owner not found");

//     owner.is_approved = false;
//     await owner.save();

//     return successResponse(res, 200, "Business owner rejected successfully", {
//       id: owner.id,
//       name: owner.name,
//       is_approved: owner.is_approved,
//     });
//   } catch (err) {
//     return errorResponse(res, err.statusCode || 500, err.message);
//   }
// });
