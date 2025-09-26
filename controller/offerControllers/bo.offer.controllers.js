import { createOfferSchema } from "../../schemaValidation/offerValidation.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import sequelize from "../../config/db.js";
import { Offer, OfferDraft, BusinessOwner, Buyer, OfferBuyer, OfferVersion } from "../../model/index.js";
import { errorResponse, successResponse } from "../../handlers/responseHandler.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";
import { validateSizeBreakups } from "../../utlis/dateFormatter.js";
import { Op } from "sequelize";

export const createOffer = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const draftId = req.params.id;
  const transaction = await sequelize.transaction();

  try {
    // 1 Fetch the draft with business owner
    const draft = await OfferDraft.findOne({
      where: { draftNo: draftId },
      include: [
        {
          model: BusinessOwner,
          as: "businessOwner",
          attributes: ["id", "first_name", "last_name"],
        },
      ],
      transaction,
    });

    if (!draft) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, "Draft not found");
    }

    // 2 Get businessName and userRole from decoded token
    const businessName = req.user?.businessName;
    const userRole = req.user?.userRole;

    if (!businessName) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 401, "Business name not found in token");
    }

    // 3 Prepare data for validation and offer creation
    const offerData = {
      businessOwnerId: draft.businessOwnerId,
      businessName,
      fromParty: `${businessName} / ${userRole}`,
      origin: draft.origin,
      processor: draft.processor,
      plantApprovalNumber: draft.plantApprovalNumber,
      brand: draft.brand,
      draftName: draft.draftName,
      offerValidityDate: draft.offerValidityDate,
      shipmentDate: draft.shipmentDate,
      grandTotal: draft.grandTotal,
      quantity: draft.quantity,
      tolerance: draft.tolerance,
      paymentTerms: draft.paymentTerms,
      remark: draft.remark,
      productName: draft.productName,
      speciesName: draft.speciesName,
      packing: draft.packing,
      sizeBreakups: draft.sizeBreakups,
      total: draft.total,
      status: "open",
    };
    // 4 Validate offer data using Zod schema
    const parsed = createOfferSchema.safeParse(offerData);
    if (!parsed.success) {
      const messages =
        parsed?.error?.errors?.map((e) => e.message).join(", ") || "Invalid offer data";
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, messages);
    }

    // 5 Optional: validate sizeBreakups vs total/grandTotal
    const { sizeBreakups, total, grandTotal } = parsed.data;
    const validationError = validateSizeBreakups(sizeBreakups, total, grandTotal);
    if (validationError) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, validationError);
    }

    // 6 Create the Offer
    const offer = await Offer.create(parsed.data, { transaction });
    await transaction.commit();

    return successResponse(res, 201, "Offer created from draft successfully", { offer });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error creating offer from draft:", error);
    return errorResponse(res, 500, error.message || "Failed to create offer from draft");
  }
});

// Get all offers (optionally filtered by status)
export const getAllOffers = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);
  try {
    const { status } = req.query; // optional query param: ?status=open/close

    const whereClause = {};
    if (status) whereClause.status = status;

    const offers = await Offer.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    return successResponse(res, 200, "Offers fetched successfully", { offers });
  } catch (error) {
    console.error("Error fetching all offers:", error);
    return errorResponse(res, 500, error.message || "Failed to fetch offers");
  }
});

// Get offer by ID
export const getOfferById = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);
  const offerId = req.params.id;

  try {
    const offer = await Offer.findByPk(offerId);

    if (!offer) {
      return errorResponse(res, 404, "Offer not found");
    }

    return successResponse(res, 200, "Offer fetched successfully", { offer });
  } catch (error) {
    console.error("Error fetching offer by ID:", error);
    return errorResponse(res, 500, error.message || "Failed to fetch offer");
  }
});

export const updateOffer = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);
  const offerId = req.params.id;
  const transaction = await sequelize.transaction();

  try {
    // 1 Fetch the offer
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, "Offer not found");
    }

    if (offer.status === "close" || offer.isDeleted) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, "Cannot update a closed or deleted offer");
    }

    // 2 Validate request body (partial updates)
    const updateOfferSchema = createOfferSchema.partial(); // all fields optional
    const parsed = updateOfferSchema.safeParse(req.body);

    if (!parsed.success) {
      const messages =
        parsed?.error?.errors?.map((e) => e.message).join(", ") || "Invalid offer data";
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, messages);
    }

    const { sizeBreakups, total, grandTotal } = parsed.data;

    // Optional: validate sizeBreakups vs total/grandTotal only if sizeBreakups is sent
    if (sizeBreakups || total || grandTotal) {
      const validationError = validateSizeBreakups(sizeBreakups, total, grandTotal);
      if (validationError) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 400, validationError);
      }
    }

    // 3 Update the offer
    await offer.update(parsed.data, { transaction });
    await transaction.commit();

    return successResponse(res, 200, "Offer updated successfully", { offer });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error updating offer:", error);
    return errorResponse(res, 500, error.message || "Failed to update offer");
  }
});

export const closeOffer = asyncHandler(async (req, res) => {
  const offerId = req.params.id;
  const transaction = await sequelize.transaction();

  try {
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, "Offer not found");
    }

    if (offer.status === "close" || offer.isDeleted) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, "Cannot close a closed or deleted offer");
    }
    // Mark offer as closed
    await offer.update({ status: "close" }, { transaction });
    await transaction.commit();

    return successResponse(res, 200, "Offer closed successfully", { offer });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error closing offer:", error);
    return errorResponse(res, 500, error.message || "Failed to close offer");
  }
});

export const openOffer = asyncHandler(async (req, res) => {
  const offerId = req.params.id;
  const transaction = await sequelize.transaction();

  try {
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, "Offer not found");
    }

    if (offer.status === "open") {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, "Offer is already open.");
    }
    // Re-open the offer
    await offer.update({ status: "open" }, { transaction });
    await transaction.commit();

    return successResponse(res, 200, "Offer re-opened successfully", { offer });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error re-opening offer:", error);
    return errorResponse(res, 500, error.message || "Failed to re-open offer");
  }
});

export const deleteOffer = asyncHandler(async (req, res) => {
  const offerId = req.params.id;
  const transaction = await sequelize.transaction();

  try {
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, "Offer not found");
    }

    if (offer.isDeleted) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, "Offer is already deleted");
    }
    // Soft delete by marking isDeleted true
    await offer.update({ isDeleted: true, status: "close" }, { transaction });
    await transaction.commit();

    return successResponse(res, 200, "Offer deleted successfully", { offerId });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error deleting offer:", error);
    return errorResponse(res, 500, error.message || "Failed to delete offer");
  }
});

export const searchOffers = asyncHandler(async (req, res) => {
  try {
    const { offerId, offerName, status, isDeleted, page = 1, limit = 20 } = req.query;

    const filters = {};

    if (offerId) filters.id = offerId;
    if (offerName) filters.offer_name = { [Op.iLike]: `%${offerName}%` };
    if (status) filters.status = status; // should be 'open' or 'close'
    if (isDeleted !== undefined) filters.isDeleted = isDeleted === "true";

    const offset = (page - 1) * limit;

    const { rows: offers, count: total } = await Offer.findAndCountAll({
      where: filters,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return successResponse(res, 200, "Offers fetched successfully", {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      offers,
    });
  } catch (error) {
    console.error("Error searching offers:", error);
    return errorResponse(res, 500, error.message || "Failed to search offers");
  }
});

// export const sendOffer = asyncHandler(async (req, res) => {
//   const { id: offerId } = req.params;
//   const { buyerIds } = req.body;
//   const businessOwnerId = req.user?.id; // id of logged-in business owner from token
//   const businessName = req.user?.businessName;
//   const userRole = req.user?.userRole;
//   const transaction = await sequelize.transaction();

//   try {
//     if (!Array.isArray(buyerIds) || buyerIds.length === 0) {
//       if (!transaction.finished) await transaction.rollback();
//       return errorResponse(res, 400, "buyerIds must be a non-empty array");
//     }

//     // Fetch the offer
//     const offer = await Offer.findByPk(offerId, { transaction });
//     if (!offer) {
//       if (!transaction.finished) await transaction.rollback();
//       return errorResponse(res, 404, "Offer not found");
//     }
//     if (offer.status === "close" || offer.isDeleted) {
//       if (!transaction.finished) await transaction.rollback();
//       return errorResponse(res, 400, "Cannot send a closed or deleted offer");
//     }

//     // Fetch buyers and validate
//     const buyers = await Buyer.findAll({
//       where: { id: buyerIds },
//       transaction,
//     });
//     if (buyers.length !== buyerIds.length) {
//       if (!transaction.finished) await transaction.rollback();
//       return errorResponse(res, 400, "One or more buyers do not exist");
//     }

//     // 🔐 Validate buyer belongs to the business owner
//     const unauthorizedBuyer = buyers.find(b => b.ownerId !== businessOwnerId);
//     if (unauthorizedBuyer) {
//       if (!transaction.finished) await transaction.rollback();
//       return errorResponse(
//         res,
//         403,
//         `Unauthorized: Buyer ${unauthorizedBuyer.buyersCompanyName} does not belong to your business`
//       );
//     }

//     // Fetch existing OfferBuyer entries
//     const existingOfferBuyers = await OfferBuyer.findAll({
//       where: { offerId, buyerId: buyerIds },
//       transaction,
//     });
//     const existingBuyerIds = existingOfferBuyers.map(ob => ob.buyerId);

//     // Insert new OfferBuyer entries
//     const newOfferBuyerData = buyerIds
//       .filter(id => !existingBuyerIds.includes(id))
//       .map(buyerId => ({ offerId, buyerId, status: "open" }));

//     const createdOfferBuyers = await OfferBuyer.bulkCreate(newOfferBuyerData, {
//       transaction,
//       returning: true,
//     });

//     const allOfferBuyers = [...existingOfferBuyers, ...createdOfferBuyers];

//     // Create OfferVersion entries
//     for (const offerBuyer of allOfferBuyers) {
//       if (offerBuyer.status !== "close") {
//         const lastVersion = await OfferVersion.findOne({
//           where: { offerBuyerId: offerBuyer.id },
//           order: [["versionNo", "DESC"]],
//           transaction,
//         });
//         const nextVersionNo = lastVersion ? lastVersion.versionNo + 1 : 1;

//         const fromParty = `${businessName} / ${userRole}`;
//         const buyer = buyers.find(b => b.id === offerBuyer.buyerId);
//         const toParty = `${buyer?.buyersCompanyName || "Unknown Buyer"} / buyer`;

//         await OfferVersion.create(
//           {
//             offerBuyerId: offerBuyer.id,
//             versionNo: nextVersionNo,
//             fromParty,
//             toParty,
//             offerName: offer.offerName,
//             productName: req.body.productName ?? offer.productName,
//             speciesName: req.body.speciesName ?? offer.speciesName,
//             brand: req.body.brand ?? offer.brand,
//             plantApprovalNumber: req.body.plantApprovalNumber ?? offer.plantApprovalNumber,
//             quantity: req.body.quantity ?? offer.quantity,
//             tolerance: req.body.tolerance ?? offer.tolerance,
//             paymentTerms: req.body.paymentTerms ?? offer.paymentTerms,
//             sizeBreakups: req.body.sizeBreakups ?? offer.sizeBreakups,
//             grandTotal: req.body.grandTotal ?? offer.grandTotal,
//             shipmentDate: req.body.shipmentDate ?? offer.shipmentDate,
//             remark: req.body.remark ?? offer.remark,
//             status: "open",
//           },
//           { transaction }
//         );
//       }
//     }

//     await transaction.commit();
//     return successResponse(res, 200, "Offer sent to buyers successfully", { offerId, buyerIds });
//   } catch (error) {
//     if (!transaction.finished) await transaction.rollback();
//     console.error("Error sending offer:", error);
//     return errorResponse(res, 500, error.message || "Failed to send offer");
//   }
// });




export const sendOffer = asyncHandler(async (req, res) => {
  const { id: offerId } = req.params;
  const { buyerIds } = req.body;
  const businessOwnerId = req.user?.id;
  const businessName = req.user?.businessName;
  const userRole = req.user?.userRole;

  if (!Array.isArray(buyerIds) || !buyerIds.length) {
    return errorResponse(res, 400, "buyerIds must be a non-empty array");
  }

  const transaction = await sequelize.transaction();
  try {
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer) {
      return errorResponse(res, 404, "Offer not found");
    }
    if (offer.status === "close" || offer.isDeleted) {
      return errorResponse(res, 400, "Cannot send a closed or deleted offer");
    }

    const buyers = await Buyer.findAll({ where: { id: buyerIds }, transaction });
    const unauthorized = buyers.filter(b => b.ownerId !== businessOwnerId);
    if (unauthorized.length) throw new Error(`Buyer ${unauthorized[0].buyersCompanyName} does not belong to your business`);

    const existingOfferBuyers = await OfferBuyer.findAll({ where: { offerId, buyerId: buyerIds }, transaction });
    const existingIds = existingOfferBuyers.map(b => b.buyerId);

    const newOfferBuyers = buyerIds
      .filter(id => !existingIds.includes(id))
      .map(buyerId => ({ offerId, buyerId, status: "open" }));

    const createdOfferBuyers = await OfferBuyer.bulkCreate(newOfferBuyers, { transaction, returning: true });
    const allOfferBuyers = [...existingOfferBuyers, ...createdOfferBuyers];

    const buyersMap = Object.fromEntries(buyers.map(b => [b.id, b]));

    const versions = [];
    for (const ob of allOfferBuyers) {
      if (ob.status !== "close") {
        const lastVersion = await OfferVersion.findOne({
          where: { offerBuyerId: ob.id },
          order: [["versionNo", "DESC"]],
          transaction
        });
        const nextVersion = lastVersion ? lastVersion.versionNo + 1 : 1;

        const buyer = buyersMap[ob.buyerId];
        versions.push({
          offerBuyerId: ob.id,
          versionNo: nextVersion,
          fromParty: `${businessName} / ${userRole}`,
          toParty: `${buyer.buyersCompanyName} / buyer`,
          offerName: offer.offerName,
          productName: req.body.productName ?? offer.productName,
          speciesName: req.body.speciesName ?? offer.speciesName,
          brand: req.body.brand ?? offer.brand,
          plantApprovalNumber: req.body.plantApprovalNumber ?? offer.plantApprovalNumber,
          quantity: req.body.quantity ?? offer.quantity,
          tolerance: req.body.tolerance ?? offer.tolerance,
          paymentTerms: req.body.paymentTerms ?? offer.paymentTerms,
          sizeBreakups: req.body.sizeBreakups ?? offer.sizeBreakups,
          grandTotal: req.body.grandTotal ?? offer.grandTotal,
          shipmentDate: req.body.shipmentDate ?? offer.shipmentDate,
          remark: req.body.remark ?? offer.remark,
          status: "open",
        });
      }
    }

    await OfferVersion.bulkCreate(versions, { transaction });
    await transaction.commit();

    return successResponse(res, 200, "Offer sent to buyers successfully", { offerId, buyerIds });
  } catch (err) {
    await transaction.rollback();
    return errorResponse(res, 500, err.message || "Failed to send offer");
  }
});
