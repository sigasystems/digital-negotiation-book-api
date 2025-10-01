import { z } from "zod";

export const buyerSchema = z.object({
  ownerId: z.string().uuid({ message: "Owner ID must be a valid UUID" }),

  // Company Identity
  buyersCompanyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters long" })
    .max(300, { message: "Company name can not exceed 300 characters" }),

  registrationNumber: z
    .string()
    .min(2, { message: "Registration number must be at least 2 characters" })
    .optional(),

  taxId: z.string().optional(),

  // Primary Contact Person
  contactName: z
    .string()
    .min(2, { message: "Contact name must be at least 2 characters long" })
    .max(300, { message: "Contact name can not exceed 300 characters" }),

  contactEmail: z
    .string()
    .email({ message: "Contact email must be a valid email address" }),

  countryCode: z
    .string()
    .regex(/^\+[1-9]\d{0,3}$/, {
      message: "Country code must be in E.164 format (e.g., +1, +44, +91)",
    }),

  contactPhone: z
    .string()
    .min(4, { message: "Phone number must be at least 4 digits" })
    .max(20, { message: "Phone number cannot exceed 20 characters" })
    .regex(/^[0-9\-() ]*$/, {
      message: "Phone number contains invalid characters",
    })
    .optional(),

  // Address Info
  country: z.string().min(2, { message: "Country is required" }),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),

  // System fields
 status: z
  .enum(["active", "inactive"], { message: "Status must be active or inactive" })
  .default("active"),

  isVerified: z.boolean().default(false),
  isDeleted: z.boolean().default(false),

  // Timestamp fields
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

// ✅ For search queries — all optional
export const buyerSearchSchemaValidation = z.object({
  country: z.string().min(1, "Country cannot be empty").optional(),
  status: z.enum(["active", "inactive"]).optional(),
  isVerified: z.boolean().optional(),
});

//  For updates (partial fields allowed)
export const buyerSchemaValidation = buyerSchema.partial();
