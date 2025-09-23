import { z } from "zod";

export const productSchema = z.object({
  code: z.string().min(1, "Code is required"),
  productName: z.string().min(1, "Product name is required"),
  species: z.string().max(150, "Species max length is 150"),
  size: z.array(z.string()).optional(),
});
