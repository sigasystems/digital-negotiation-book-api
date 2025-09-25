import { asyncHandler } from "../../handlers/asyncHandler.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";
import { errorResponse, successResponse } from "../../handlers/responseHandler.js";
import { Offer } from "../../model/index.js";
import OfferSchema from "../../schemaValidation/offerValidation.js";
import {formatOfferDates, validateSizeBreakups} from "../../utlis/dateFormatter.js"
import { Op } from "sequelize";

// ----------------------
// CREATE OfferDraft
// ----------------------
export const createOffer = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["business_owner"]);

    const parsed = OfferSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => issue.message);
      return errorResponse(res, 400, `Validation failed: ${errors.join(", ")}`);
    }

    const { sizeBreakups, total, grandTotal } = parsed.data;

    const validationError = validateSizeBreakups(sizeBreakups, total, grandTotal);
    if (validationError) {
      return errorResponse(res, 400, validationError);
    }

    const draft = await Offer.create(parsed.data);
    return successResponse(
      res,
      201,
      "Offer draft created successfully",
      formatOfferDates(draft)
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || 500,
      err.message || "Internal Server Error"
    );
  }
});

// ----------------------
// READ All OfferDrafts
// ----------------------
export const getAllOfferDrafts = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["business_owner"]);

    const drafts = await Offer.findAll();
    const formattedDrafts = drafts.map(formatOfferDates);

    return successResponse(
      res,
      200,
      "Offer drafts fetched successfully",
      {
        length: formattedDrafts.length,
        drafts: formattedDrafts
      }
    );
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// ----------------------
// READ Single OfferDraft
// ----------------------
export const getOfferDraftById = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["business_owner"]);

    const { id } = req.params;
    if (!/^\d+$/.test(id)) return errorResponse(res, 400, "Invalid draft ID format");

    const draft = await Offer.findByPk(id);
    if (!draft) return errorResponse(res, 404, "Offer draft not found");

    return successResponse(res, 200, "Offer draft fetched successfully", formatOfferDates(draft));
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// ----------------------
// UPDATE OfferDraft
// ----------------------
export const updateOfferDraft = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["business_owner"]);

    const { id } = req.params;
    if (!/^\d+$/.test(id)) 
      return errorResponse(res, 400, "Invalid draft ID format");

    const draft = await Offer.findByPk(id, { paranoid: false });
    if (!draft) 
      return errorResponse(res, 404, "Offer draft not found");

    if (draft.isDeleted || draft.deletedAt) {
      return errorResponse(res, 400, "Cannot update a deleted offer draft");
    }

    if (draft.status === "close") {
      return errorResponse(res, 400, "Cannot update an offer draft with status 'close'");
    }

    const partialSchema = OfferSchema.partial();
    const parsed = partialSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => issue.message);
      return errorResponse(res, 400, `Validation failed: ${errors.join(", ")}`);
    }

    const { sizeBreakups, total, grandTotal } = parsed.data;

    // Only validate sizeBreakups if all three fields are present
    if (sizeBreakups && total && grandTotal) {
      const validationError = validateSizeBreakups(sizeBreakups, total, grandTotal);
      if (validationError) {
        return errorResponse(res, 400, validationError);
      }
    }
    // Update the draft
    await draft.update(parsed.data);

    // Reload to get the latest values
    await draft.reload();

    return successResponse(
      res,
      200,
      "Offer draft updated successfully",
      formatOfferDates(draft)
    );
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// ----------------------
// DELETE OfferDraft
// ----------------------
export const deleteOfferDraft = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["business_owner"]);

    const { id } = req.params;
    if (!/^\d+$/.test(id)) 
      return errorResponse(res, 400, "Invalid draft ID format");

    const draftId = Number(id);

    // Include soft-deleted rows to check if already deleted
    const draft = await Offer.findOne({ 
      where: { draftNo: draftId },
      paranoid: false
    });

    if (!draft) 
      return errorResponse(res, 404, "Offer draft not found");

    // Check if already deleted
    if (draft.deletedAt || draft.isDeleted) {
      return errorResponse(
        res,
        400,
        "Offer draft is already deleted, no action performed"
      );
    }
    // Soft delete
    // Soft delete
await draft.update({ isDeleted: true, deletedAt: new Date() });

// Reload instance to get updated deletedAt
await draft.reload({ paranoid: false });

const deletedAt = formatOfferDates(draft);

// Return only draftNo and deletedAt
return successResponse(
  res,
  200,
  "Offer draft soft-deleted successfully",
  {
    draftNo: draft.draftNo,
    deletedAt: deletedAt.deletedAt
  }
);


  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// ----------------------
// UPDATE Offer Status
// ----------------------
export const updateOfferStatus = asyncHandler(async (req, res) => {
  try {
    // Authorization check
    authorizeRoles(req, ["business_owner"]);

    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (!/^\d+$/.test(id)) 
      return errorResponse(res, 400, "Invalid draft ID format");

    // Validate status using Zod
    const statusSchema = OfferSchema.pick({ status: true }).required();
    const parsed = statusSchema.safeParse({ status });
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => issue.message);
      return errorResponse(res, 400, `Validation failed: ${errors.join(", ")}`);
    }

    const draft = await Offer.findByPk(id, { paranoid: false }); // include soft-deleted rows

    // Check if draft exists
    if (!draft) 
      return errorResponse(res, 404, "Offer draft not found");

    // Prevent updates on deleted drafts
    if (draft.isDeleted || draft.deletedAt) {
      return errorResponse(
        res,
        400,
        "Cannot update status: Offer draft is deleted"
      );
    }

    // Prevent updating to the same status
    if (draft.status === parsed.data.status) {
      return errorResponse(
        res,
        400,
        `Offer draft status is already '${parsed.data.status}', no action performed`
      );
    }

    // Update status
    await draft.update({ status: parsed.data.status });

    // Return minimal response
    return successResponse(
      res,
      200,
      "Offer draft status updated successfully",
      {
        draftNo: draft.draftNo,
        status: draft.status
      }
    );
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});
// ----------------------
// SEARCH OfferDrafts
// ----------------------
export const searchOfferDrafts = asyncHandler(async (req, res) => {
  try {
    // Authorization check
    authorizeRoles(req, ["business_owner"]);

    const { draftNo, draftName, status, isDeleted } = req.query;

    // Build dynamic filter object
    const whereClause = {};
    if (draftNo) {
      if (!/^\d+$/.test(draftNo)) 
        return errorResponse(res, 400, "Invalid draftNo format");
      whereClause.draftNo = Number(draftNo);
    }
    if (draftName) {
      whereClause.draftName = { [Op.like]: `%${draftName}%` }; // partial match
    }
    if (status) {
      whereClause.status = status;
    }
    if (isDeleted !== undefined) {
      // Convert query param to boolean
      const deletedFlag = isDeleted === "true";
      whereClause.isDeleted = deletedFlag;
    }

    // Fetch drafts including soft-deleted rows
    const drafts = await Offer.findAll({ 
      where: whereClause,
      paranoid: false // include deleted records
    });

    if (!drafts.length) {
      return successResponse(res, 200, "No matching offer drafts found", {
        length: 0,
        drafts: []
      });
    }

    const formattedDrafts = drafts.map(formatOfferDates);

    return successResponse(res, 200, "Offer drafts fetched successfully", {
      length: formattedDrafts.length,
      drafts: formattedDrafts
    });
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});


