import { asyncHandler } from "../../handlers/asyncHandler.js";
import sequelize from "../../config/db.js";
import { Offer, OfferBuyer, OfferVersion, OfferResult, Buyer, BusinessOwner } from "../../model/index.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { z } from "zod";
import { Op } from "sequelize";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";

// Zod validation for request body
const respondOfferSchema = z.object({
  buyerIds: z.array(z.string().uuid({ message: "Each buyerId must be a valid UUID" })),
  action: z.enum(["accept", "reject"], { message: "action must be 'accept' or 'reject'" }),
});

export const sendOffer = asyncHandler(async (req, res) => {
  const { id: offerId } = req.params;
  const { buyerIds } = req.body;
  const userId = req.user?.id;
  const businessName = req.user?.businessName;
  const userRole = req.user?.userRole;
  const transaction = await sequelize.transaction();
  let owner;

  try {
    if (!Array.isArray(buyerIds) || buyerIds.length === 0) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, "Invalid request: Please provide at least one valid buyer ID.");
    }

    // Fetch the offer
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(
        res,
        404,
        `Offer not found with ID: ${offerId}. It may never have existed or has been permanently removed.`
      );
    }

    if (offer.status === "close" || offer.isDeleted) {
      if (!transaction.finished) await transaction.rollback();
      const reason = offer.status === "close" ? "closed" : "deleted";
      return errorResponse(
        res,
        400,
        `Cannot send offer "${offer.offerName}" (ID: ${offerId}) because it is ${reason}.`
      );
    }

    let buyers = [];

    if (userRole === "business_owner") {
      buyers = await Buyer.findAll({ where: { id: buyerIds }, transaction });
      if (buyers.length !== buyerIds.length) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 400, "Some of the buyers you selected were not found. Please check the buyer IDs or company names and try again.");
      }

      for (const buyer of buyers) {
        if (buyer.ownerId !== userId) {
          if (!transaction.finished) await transaction.rollback();
          return errorResponse(
            res,
            403,
            `You cannot send this offer to "${buyer.buyersCompanyName}" because this buyer is not registered under your business.`
          );
        }
      }

      const owner = await BusinessOwner.findOne({
        where: { id: userId, status : "active" },
        transaction,
      });
      if (!owner) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(
          res,
          403,
          "Unauthorized: You are not an active business owner"
        );
      }

    } else if (userRole === "buyer") {
      if (!buyerIds.includes(userId)) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(
          res,
          403,
          "Unauthorized: As a buyer you can only send offers for yourself"
        );
      }

      const buyer = await Buyer.findByPk(userId, { transaction });
      if (!buyer) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 404, "Buyer not found");
      }
      owner = await BusinessOwner.findOne({
        where: { id: buyer.ownerId, status: "active"},
        transaction,
      });
      if (!owner) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(
          res,
          403,
          `You cannot send offers because your associated business owner ("${buyer?.buyersCompanyName}") is not active. Please contact the business owner or support for assistance.`
        );
      }

      buyers = [buyer];

    } else {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 403, "Unauthorized: Invalid role");
    }

    const existingOfferBuyers = await OfferBuyer.findAll({ where: { offerId, buyerId: buyerIds }, transaction });
    const existingBuyerIds = existingOfferBuyers.map(ob => ob.buyerId);

    const newOfferBuyerData = buyerIds
      .filter(id => !existingBuyerIds.includes(id))
      .map(buyerId => ({
        offerId,
        buyerId,
        ownerId: userRole === "business_owner" 
          ? userId      
          : owner?.id || null, 
        status: "open"
      }));

    const createdOfferBuyers = await OfferBuyer.bulkCreate(newOfferBuyerData, { transaction, returning: true });
    const allOfferBuyers = [...existingOfferBuyers, ...createdOfferBuyers];

       for (const offerBuyer of allOfferBuyers) {
      if (offerBuyer.status !== "close") {
        const lastVersion = await OfferVersion.findOne({
          where: { offerBuyerId: offerBuyer.id },
          order: [["versionNo", "DESC"]],
          transaction
        });
        const nextVersionNo = lastVersion ? lastVersion.versionNo + 1 : 1;

    let fromParty, toParty;
    const buyer = buyers.find(b => b.id === offerBuyer.buyerId);
    if (userRole === "business_owner") {
      fromParty = `${businessName} / business_owner`;
      toParty = `${buyer?.buyersCompanyName || "Unknown Buyer"} / buyer`;
    } else if (userRole === "buyer") {
      fromParty = `${buyer?.buyersCompanyName || "Unknown Buyer"} / buyer`;
      toParty = `${owner?.businessName || "Unknown Owner"} / business_owner`;
    }

    await OfferVersion.create(
      {
        offerBuyerId: offerBuyer.id,
        versionNo: nextVersionNo,
        fromParty,
        toParty,
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
        },
      { transaction });
      }
    }

    await transaction.commit();
    
    let message;
    if (userRole === "business_owner") {
      const buyerNames = buyers.map(b => b.buyersCompanyName).join(", ");
      message = `Offer (ID: ${offerId}) has been sent successfully from ${businessName} / business_owner to buyers: ${buyerNames}`;
    } else if (userRole === "buyer") {
      message = `Offer (ID: ${offerId}) has been sent successfully from ${buyers[0]?.buyersCompanyName} / buyer to business owner: ${owner?.businessName}`;
    } else {
      message = `Offer (ID: ${offerId}) has been sent successfully.`;
    }

    return successResponse(res, 200, message, {
      offerId,
      from: userRole === "business_owner" ? businessName : buyers[0]?.buyersCompanyName,
      to: userRole === "business_owner" ? buyers.map(b => b.buyersCompanyName) : owner?.businessName,
      buyerIds
    });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error sending offer:", error);
    return errorResponse(res, 500, error.message || "Failed to send offer");
  }
});

export const respondOffer = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { buyerId, action } = req.body;
    const offerId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.userRole;

    // Fetch offer
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer || offer.status === "close" || offer.isDeleted) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, `Offer not found with ID: ${offerId}. It may never have been created or has been removed.`);
    }

    const buyer = await Buyer.findByPk(buyerId, { transaction });
    if (!buyer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, `The buyer with ID: ${buyerId} was not found. Please check the buyer ID or company name and try again.`);
    }

    let owner;
    if (userRole === "business_owner") {
      owner = await BusinessOwner.findByPk(userId, { transaction });
      if (!owner || owner.status !== "active") {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 403, "You are not an active business owner");
      }

      if (buyer.ownerId !== owner.id) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 403, `You cannot respond to this offer for "${buyer.buyersCompanyName}" because this buyer is not registered under your business. Please check your buyer list and try again.`);
      }
      if (offer.businessOwnerId !== owner.id) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 403, `You cannot respond to this offer ("${offer.offerName}") because it was prepared by another business.`);
      }

    } else {
      owner = await BusinessOwner.findByPk(buyer.ownerId, { transaction });
    if (!owner || owner.status !== "active") {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 403, "Buyer does not belong to a valid/active business owner");
      }
    }

    // Role-based authorization
    if (userRole === "buyer" && userId !== buyer.id) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 403, "You can only respond to your own offers");
    } else if (!["buyer", "business_owner"].includes(userRole)) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 403, "Invalid role");
    }

    // Fetch OfferBuyer
    const offerBuyer = await OfferBuyer.findOne({
      where: { offerId, buyerId },
      transaction,
    });
    if (!offerBuyer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, "OfferBuyer association not found");
    }

    // Fetch last result for this buyer
    const lastResult = await OfferResult.findOne({
      where: { offerId, buyerId },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    // Determine actor details
    const actorName = userRole === "buyer" ? buyer.contactName : `${owner.first_name} ${owner.last_name}`;
    const actorCompany = userRole === "buyer" ? buyer.buyersCompanyName : owner.id;
    const actorFullDetails = `${actorName} / ${actorCompany} / ${userRole}`;

    // Check if this actor already responded
    if (lastResult) {
      if (action === "accept" && lastResult.isAccepted && lastResult.acceptedBy?.includes(actorCompany)) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 400, "You have already accepted this offer");
      }
      if (action === "reject" && lastResult.isRejected && lastResult.rejectedBy?.includes(actorCompany)) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 400, "You have already rejected this offer");
      }
    }
    // Fetch latest OfferVersion
    const lastVersion = await OfferVersion.findOne({
      where: { offerBuyerId: offerBuyer.id },
      order: [["versionNo", "DESC"]],
      transaction,
    });
    const offerVersionId = lastVersion?.id;

    // Create OfferResult
    const offerResult = await OfferResult.create(
      {
        offerVersionId,
        offerId,
        ownerId: owner.id,
        buyerId: buyer.id,
        isAccepted: action === "accept" ? true : null,
        acceptedBy: action === "accept" ? actorFullDetails : null,
        isRejected: action === "reject" ? true : null,
        rejectedBy: action === "reject" ? actorFullDetails : null,
        ownerCompanyName: owner.businessName,
        buyerCompanyName: buyer.buyersCompanyName,
        ownerName: `${owner.first_name} ${owner.last_name}`,
        buyerName: buyer.contactName,
        offerName: offer.offerName
      },
      { transaction }
    );

    await transaction.commit();
    return successResponse(res, 200, `Offer ${action}ed successfully`, offerResult);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error responding to offer:", error);
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, error.errors.map(e => e.message).join(", "));
    }
    return errorResponse(res, 500, error.message || "Failed to respond to offer");
  }
});

export const getRecentNegotiations = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["business_owner"]);
    // Get IDs from body or from authenticated user token
    let ownerId = req.body.ownerId || (req.user?.userRole === "business_owner" ? req.user.id : null);
    let buyerId = req.body.buyerId || (req.user?.userRole === "buyer" ? req.user.id : null);

    if (!ownerId && !buyerId) {
      return errorResponse(res, 400, "Owner ID or Buyer ID must be provided or available in token");
    }

    // Fetch all OfferBuyers for this owner and buyer
   const whereClause = {};
    if (ownerId) whereClause.ownerId = ownerId;
    if (buyerId) whereClause.buyerId = buyerId;

    const offerBuyers = await OfferBuyer.findAll({
      where: whereClause,
      include: [
        {
          model: OfferVersion,
          as: "versions",
          order: [["versionNo", "DESC"]],
        },
      ],
    });

    // Collect all OfferVersions into a single array
    const negotiations = [];
    offerBuyers.forEach((offerBuyer) => {
      offerBuyer.versions.forEach((version) => {
        negotiations.push({
          offerVersionId: version.id,
          offerId: version.offerId,
          versionNo: version.versionNo,
          fromParty: version.fromParty,
          toParty: version.toParty,
          productName: version.productName,
          speciesName: version.speciesName,
          brand: version.brand,
          plantApprovalNumber: version.plantApprovalNumber,
          quantity: version.quantity,
          tolerance: version.tolerance,
          paymentTerms: version.paymentTerms,
          sizeBreakups: version.sizeBreakups,
          grandTotal: version.grandTotal,
          shipmentDate: version.shipmentDate,
          remark: version.remark,
          offerName: version.offerName,
          createdAt: version.createdAt,
          updatedAt: version.updatedAt,
        });
      });
    });

    return successResponse(res, 200, "Recent negotiations fetched successfully", negotiations);
  } catch (error) {
    console.error("Error fetching negotiations:", error);
    return errorResponse(res, 500, error.message || "Failed to fetch recent negotiations");
  }
});

export const getLatestNegotiation = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["business_owner"]);
    const ownerId = req.body.ownerId || (req.user?.userRole === "business_owner" ? req.user.id : null);
    const buyerId = req.body.buyerId || (req.user?.userRole === "buyer" ? req.user.id : null);

    if (!ownerId && !buyerId) {
      return errorResponse(res, 400, "Owner ID or Buyer ID must be provided or available in token");
    }

    // Fetch the OfferBuyer record
    const offerBuyer = await OfferBuyer.findOne({
      where: {
        ...(ownerId && { ownerId }),
        ...(buyerId && { buyerId }),
      },
    });

    if (!offerBuyer) {
      return successResponse(res, 200, "No negotiations found for this owner/buyer", []);
    }

    // Find the latest versionNo for this offerBuyer
    const latestVersion = await OfferVersion.findOne({
      where: { offerBuyerId: offerBuyer.id },
      order: [["versionNo", "DESC"]],
    });

    if (!latestVersion) {
      return successResponse(res, 200, "No negotiations found for this owner/buyer", []);
    }

    // Fetch all versions of the latest negotiation series (up to latestVersion.versionNo)
    // Assuming continuous versionNo sequence represents a single negotiation
    const versions = await OfferVersion.findAll({
      where: {
        offerBuyerId: offerBuyer.id,
        versionNo: { [Op.lte]: latestVersion.versionNo },
      },
      order: [["versionNo", "ASC"]],
    });

    // Format response
    const negotiations = versions.map(version => ({
      offerVersionId: version.id,
      offerId: version.offerId,
      versionNo: version.versionNo,
      fromParty: version.fromParty,
      toParty: version.toParty,
      productName: version.productName,
      speciesName: version.speciesName,
      brand: version.brand,
      plantApprovalNumber: version.plantApprovalNumber,
      quantity: version.quantity,
      tolerance: version.tolerance,
      paymentTerms: version.paymentTerms,
      sizeBreakups: version.sizeBreakups,
      grandTotal: version.grandTotal,
      shipmentDate: version.shipmentDate,
      remark: version.remark,
      offerName: version.offerName,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    }));

    return successResponse(res, 200, "Latest negotiation versions fetched successfully", negotiations);
  } catch (error) {
    console.error("Error fetching latest negotiation:", error);
    return errorResponse(res, 500, error.message || "Failed to fetch latest negotiation");
  }
})