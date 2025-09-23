import { z } from "zod";

export const locationSchema = z.object({
  locationName: z.string().min(1, "Location name is required"),
  code: z.string().min(1, "Code is required"),
  portalCode: z.string().min(1, "Portal code is required"),
  country: z.string().min(1, "Country is required"),
});
