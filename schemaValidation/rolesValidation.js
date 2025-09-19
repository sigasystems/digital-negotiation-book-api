import { z } from "zod";

// ✅ Role validation
export const roleSchemaValidation = z.object({
  id: z.number().int().min(1).max(5), // Only IDs 1-5 allowed
  name: z.enum([
    "super_admin",
    "business_owner",
    "manager",
    "support_staff",
    "buyer",
  ]),
  description: z.string().max(255).optional().default(""),
  isActive: z.boolean().optional().default(true),
});

// 🔹 For updates (partial allowed)
export const updateRoleSchemaValidation = roleSchemaValidation.partial();
