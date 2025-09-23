import { z } from "zod";

const OfferSchema = z.object({
  // ---------------------------
  // About Business Owner Section
  // ---------------------------
  businessOwnerId: z.string().uuid(),
  draftNo: z.number().int().positive().optional(),
  fromParty: z.string().max(150),
  origin: z.string().max(50),
  processor: z.string().max(50).optional(),
  plantApprovalNumber: z.string().max(50),
  brand: z.string().max(50),

  // ---------------------------
  // About Draft Section
  // ---------------------------
  draftName: z.string().max(50).optional(),
  offerValidityDate: z.coerce.date().optional(),
  shipmentDate: z.coerce.date().optional(),
  grandTotal: z.number().optional(),
  quantity: z.string().optional(),
  tolerance: z.string().optional(),
  paymentTerms: z.string().optional(),
  remark: z.string().max(100).optional(),

  // ---------------------------
  // Product Info Section
  // ---------------------------
  productName: z.string().max(100),
  speciesName: z.string().max(100),
  packing: z.string().optional(),

  // ---------------------------
  // Sizes/Breakups Section
  // ---------------------------
  sizeBreakups: z
    .array(
      z.object({
        size: z.string(),              // e.g., "20/30"
        breakup: z.number().int(),     // e.g., 250
        condition: z.string().max(50).optional(),
        price: z.number(),             // e.g., 1.5
      })
    )
    .nonempty(), // must have at least one sizeBreakup

  total: z.number().optional(),

  // ---------------------------
  // System Fields
  // ---------------------------
  isDeleted: z.boolean().optional(),
  status: z.enum(["open", "close"], {
    errorMap: () => ({
      message: "Invalid value for 'status': expected one of 'open', 'close'",
    }),
  }).optional(),
  deletedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default OfferSchema;
