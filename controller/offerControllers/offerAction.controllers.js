import { asyncHandler } from "../../handlers/asyncHandler.js";
import sequelize from "../../config/db.js";
import { Offer, OfferBuyer, OfferVersion, OfferResult, Buyer, BusinessOwner } from "../../model/index.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { z } from "zod";

// Zod validation for request body
const respondOfferSchema = z.object({
  buyerId: z.string().uuid({ message: "buyerId must be a valid UUID" }),
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
      return errorResponse(res, 400, "buyerIds must be a non-empty array");
    }

    // Fetch the offer
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, "Offer not found");
    }
    if (offer.status === "close" || offer.isDeleted) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, "Cannot send a closed or deleted offer");
    }

    let buyers = [];

    if (userRole === "business_owner") {
      buyers = await Buyer.findAll({ where: { id: buyerIds }, transaction });
      if (buyers.length !== buyerIds.length) {
        if (!transaction.finished) await transaction.rollback();
        return errorResponse(res, 400, "One or more buyers do not exist");
      }

      for (const buyer of buyers) {
        if (buyer.ownerId !== userId) {
          if (!transaction.finished) await transaction.rollback();
          return errorResponse(
            res,
            403,
            `Unauthorized: Buyer ${buyer.buyersCompanyName} does not belong to your business`
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
          "Unauthorized: Your associated business owner is not active"
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
      .map(buyerId => ({ offerId, buyerId, status: "open" }));

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
    return successResponse(res, 200, "Offer sent to buyers successfully", { offerId, buyerIds });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error sending offer:", error);
    return errorResponse(res, 500, error.message || "Failed to send offer");
  }
});

export const respondOffer = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { buyerId, action } = respondOfferSchema.parse(req.body);
    const offerId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.userRole;

    // Fetch offer
    const offer = await Offer.findByPk(offerId, { transaction });
    if (!offer || offer.status === "close" || offer.isDeleted) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 400, "Offer not found or closed/deleted");
    }

    // Fetch buyer and owner
    const buyer = await Buyer.findByPk(buyerId, { transaction });
    if (!buyer) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 404, "Buyer not found");
    }

    const owner = await BusinessOwner.findByPk(buyer.ownerId, { transaction });
    if (!owner || owner.status !== "active") {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 403, "Buyer does not belong to a valid/active business owner");
    }

    // Role-based authorization
    if (userRole === "buyer" && userId !== buyer.id) {
      if (!transaction.finished) await transaction.rollback();
      return errorResponse(res, 403, "You can only respond to your own offers");
    } else if (userRole !== "buyer" && userRole !== "business_owner") {
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
    const actorCompany = userRole === "buyer" ? buyer.buyersCompanyName : owner.businessName;
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