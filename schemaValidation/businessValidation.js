import { z } from "zod";

export const businessOwnerSchema = z.object({
  first_name: z.union([z.string().min(2, "First name must be at least 2 chars"), z.null()]).optional(),
  last_name: z.union([z.string().min(2, "Last name must be at least 2 chars"), z.null()]).optional(),
  email: z.string().email(),
  phoneNumber: z.union([z.string().min(10).max(20), z.null()]).optional(),
  businessName: z.string(),
  registrationNumber: z.union([z.string(), z.null()]).optional(),
  country: z.string(),
  state: z.union([z.string(), z.null()]).optional(),
  city: z.union([z.string(), z.null()]).optional(),
  address: z.union([z.string(), z.null()]).optional(),
  postalCode: z.union([z.string(), z.null()]).optional(),
});


