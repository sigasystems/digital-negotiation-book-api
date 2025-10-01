import { z } from "zod";

export const OfferSchema = z.object({
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

export const createOfferSchema = z.object({
  businessOwnerId: z.string().uuid(),
  businessName: z.string().min(1),
  fromParty: z.string().min(1),
  origin: z.string().min(1),
  processor: z.string().optional(),
  plantApprovalNumber: z.string().min(1),
  brand: z.string().min(1),
  draftName: z.string().optional(),
  offerName: z.string().optional(),
  offerValidityDate: z.date(),
  shipmentDate: z.date().optional(),
  grandTotal: z.number().optional(),
  quantity: z.string().optional(),
  tolerance: z.string().optional(),
  paymentTerms: z.string().optional(),
  remark: z.string().optional(),
  productName: z.string().min(1),
  speciesName: z.string().min(1),
  packing: z.string().optional(),
  sizeBreakups: z
  .array(
    z.object({
      size: z.string(),        // OK
      breakup: z.number().int(),  // REQUIRED, integer
      condition: z.string().max(50).optional(),
      price: z.number(),       // REQUIRED, number
    })
  )
  .nonempty(),
  total: z.number(),
  status: z.enum(["open", "close"]).optional(),
})

export const createOfferBuyerSchemaValidation = z.object({
  offerId: z.number().int({ message: "offerId must be an integer" }),
  buyerId: z.string().uuid({ message: "buyerId must be a valid UUID" }),
  status: z
    .enum(["open", "accepted", "rejected", "countered", "close"])
    .optional()
    .default("open"),
});

export const createOfferVersionSchemaValidation = z.object({
  offerBuyerId: z.number().int({ message: "offerBuyerId must be an integer" }),
  versionNo: z.number().int({ message: "versionNo must be an integer" }).optional(),
  madeBy: z.enum(["seller", "buyer"], { required_error: "madeBy is required" }),

  productName: z.string().min(1, "productName is required"),
  speciesName: z.string().min(1, "speciesName is required"),
  brand: z.string().min(1, "brand is required"),
  plantApprovalNumber: z.string().min(1, "plantApprovalNumber is required"),
  quantity: z.string().optional().nullable(),
  tolerance: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  sizeBreakups: z
    .array(
      z.object({
        size: z.string().min(1),
        quantity: z.number().nonnegative(),
      })
    )
    .optional()
    .default([]),
  grandTotal: z.number().optional().nullable(),
  shipmentDate: z
    .string()
    .optional()
    .nullable()
    .refine((date) => !date || !isNaN(Date.parse(date)), {
      message: "shipmentDate must be a valid date",
    }),
  remark: z.string().max(100).optional().nullable(),
});
