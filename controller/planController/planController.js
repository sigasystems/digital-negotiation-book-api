// controllers/planController.js
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { planController } from "../index.js";
import Plan from "../../model/planModel/planModel.js";

export const createPlan = asyncHandler(async (req, res) => {
  const {
    key,
    name,
    description,
    priceMonthly,
    priceYearly,
    currency,
    billingCycle,
    maxUsers,
    maxProducts,
    maxOffers,
    maxBuyers,
    features,
    trialDays,
    isDefault,
    isActive,
    sortOrder,
  } = req.body;

  // ✅ Validate required fields
  if (!key || !name) {
    return errorResponse(res, 400, "Key and Name are required.");
  }

  // ✅ Check if plan already exists
  const existing = await Plan.findOne({ where: { key } });
  if (existing) {
    return errorResponse(res, 400, `Plan with key "${key}" already exists.`);
  }

  // ✅ Create new plan
  const plan = await Plan.create({
    key,
    name,
    description,
    priceMonthly,
    priceYearly,
    currency,
    billingCycle,
    maxUsers,
    maxProducts,
    maxOffers,
    maxBuyers,
    features,
    trialDays,
    isDefault,
    isActive,
    sortOrder,
  });

  return successResponse(res, 201, "Plan created successfully!", plan);
});

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.findAll();
  return successResponse(res, 200, "Plans fetched successfully", plans);
});

export const getPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await Plan.findByPk(id);

  if (!plan) {
    return errorResponse(res, 404, "Plan not found");
  }

  return successResponse(res, 200, "Plan fetched successfully", plan);
});

export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [updatedRows] = await Plan.update(req.body, {
    where: { id },
    returning: true, // PostgreSQL support
  });

  if (updatedRows === 0) {
    return errorResponse(res, 404, "Plan not found");
  }

  const updatedPlan = await Plan.findByPk(id);
  return successResponse(res, 200, "Plan updated successfully", updatedPlan);
});

export const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedRows = await Plan.destroy({ where: { id } });

  if (deletedRows === 0) {
    return errorResponse(res, 404, "Plan not found");
  }

  return successResponse(res, 200, "Plan deleted successfully");
});

export const togglePlanStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await Plan.findByPk(id);

  if (!plan) {
    return errorResponse(res, 404, "Plan not found");
  }

  plan.isActive = !plan.isActive;
  await plan.save();

  return successResponse(
    res,
    200,
    `Plan is now ${plan.isActive ? "active" : "inactive"}`,
    plan
  );
});



export default planController;