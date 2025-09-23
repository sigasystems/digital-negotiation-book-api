import { z } from "zod";

// Schema for creating a plan
export const createPlanSchema = z.object({
  key: z.string().min(1, "Key is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priceMonthly: z.number().nonnegative("Price must be a positive number").optional(),
  priceYearly: z.number().nonnegative("Price must be a positive number").optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(["monthly", "yearly"], {
    required_error: "Billing cycle must be either monthly or yearly",
  }).optional(),
  maxUsers: z.number().int("Must be an integer").nonnegative("Must be positive").optional(),
  maxProducts: z.number().int("Must be an integer").nonnegative("Must be positive").optional(),
  maxOffers: z.number().int("Must be an integer").nonnegative("Must be positive").optional(),
  maxBuyers: z.number().int("Must be an integer").nonnegative("Must be positive").optional(),
  features: z.array(z.string(), {
    invalid_type_error: "Features must be an array of strings",
  }).optional(),
  trialDays: z.number().int("Must be an integer").nonnegative("Must be positive").optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int("Must be an integer").optional(),
});

// Schema for updating a plan (all fields optional)
export const updatePlanSchema = createPlanSchema.partial();
