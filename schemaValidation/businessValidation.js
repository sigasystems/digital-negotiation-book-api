import { z } from "zod";

export const businessOwnerSchema = z.object({
  email: z.string().email({ message: "Email must be a valid email address" }),

  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(20, { message: "Phone number cannot exceed 20 characters" })
    .regex(/^[0-9+\-() ]*$/, { message: "Phone number contains invalid characters" })
    .optional(),

  businessName: z
    .string()
    .min(2, { message: "Business name must be at least 2 characters long" }),

  businessType: z.enum(["wholesaler", "retailer", "farmer", "exporter"], {
    message: "Business type must be wholesaler, retailer, farmer, or exporter",
  }),

  registrationNumber: z
    .string()
    .min(2, { message: "Registration number must be at least 2 characters" })
    .optional(),

  country: z.string().min(2, { message: "Country is required" }),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),

  status: z
    .enum(["active", "inactive", "suspended"], {
      message: "Status must be active, inactive, or suspended",
    })
    .default("active"),

  isVerified: z.boolean().default(false),
});

// ✅ For updates (partial fields allowed)
export const updateBusinessOwnerSchema = businessOwnerSchema.partial();
