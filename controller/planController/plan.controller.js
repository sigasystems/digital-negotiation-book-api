// controllers/planController.js
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import {Plan} from "../../model/index.js";
import { z } from "zod";

export const createPlanSchema = z.object({
  key: z.string().min(1, "Key is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priceMonthly: z.number().nonnegative().optional(),
  priceYearly: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
  maxUsers: z.number().int().nonnegative().optional(),
  maxProducts: z.number().int().nonnegative().optional(),
  maxOffers: z.number().int().nonnegative().optional(),
  maxBuyers: z.number().int().nonnegative().optional(),
  features: z.array(z.string()).optional(),
  trialDays: z.number().int().nonnegative().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updatePlanSchema = createPlanSchema.partial(); 

export const createPlan = asyncHandler(async (req, res) => {
  const parsed = createPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, 400, parsed.error.issues.map(e => e.message).join(", "));
  }
  const { key, name } = parsed.data;
  const existing = await Plan.findOne({ where: { key } });
  if (existing) {
    return errorResponse(res, 400, `Plan with key "${key}" already exists.`);
  }

  // Create plan
  const plan = await Plan.create(parsed.data);
  return successResponse(res, 201, "Plan created successfully!", plan);
});

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.findAll();
  return successResponse(res, 200, "Plans fetched successfully", plans);
});

export const getPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await Plan.findByPk(id);
  if (!plan) return errorResponse(res, 404, "Plan not found");
  return successResponse(res, 200, "Plan fetched successfully", plan);
});

export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const parsed = updatePlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, 400, parsed.error.issues.map(e => e.message).join(", "));
  }
  const [updatedRows] = await Plan.update(parsed.data, {
    where: { id },
    returning: true,
  });
  if (updatedRows === 0) return errorResponse(res, 404, "Plan not found");
  const updatedPlan = await Plan.findByPk(id);
  return successResponse(res, 200, "Plan updated successfully", updatedPlan);
});

export const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedRows = await Plan.destroy({ where: { id } });
  if (deletedRows === 0) return errorResponse(res, 404, "Plan not found");
  return successResponse(res, 200, "Plan deleted successfully");
});

export const togglePlanStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await Plan.findByPk(id);
  if (!plan) return errorResponse(res, 404, "Plan not found");
  plan.isActive = !plan.isActive;
  await plan.save();
  return successResponse(res, 200, `Plan is now ${plan.isActive ? "active" : "inactive"}`, plan);
});

export default {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  togglePlanStatus,
};
