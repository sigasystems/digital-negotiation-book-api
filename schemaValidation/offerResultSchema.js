import { z } from "zod";

export const offerResultSchema = z.object({
  offerVersionId: z.number({
    required_error: "offerVersionId is required",
    invalid_type_error: "offerVersionId must be a number",
  }),
  offerId: z.number({
    required_error: "offerId is required",
    invalid_type_error: "offerId must be a number",
  }),
  ownerId: z.string({
    required_error: "ownerId is required",
    invalid_type_error: "ownerId must be a UUID string",
  }).uuid(),
  buyerId: z.string({
    required_error: "buyerId is required",
    invalid_type_error: "buyerId must be a UUID string",
  }).uuid(),
  isAccepted: z.boolean().nullable().optional(),   // nullable instead of default false
  acceptedBy: z.string().max(250).nullable().optional(),
  isRejected: z.boolean().nullable().optional(),   // nullable instead of default false
  rejectedBy: z.string().max(250).nullable().optional(),
  ownerCompanyName: z.string().max(255, "ownerCompanyName too long"),
  buyerCompanyName: z.string().max(255, "buyerCompanyName too long"),
  ownerName: z.string().max(255, "ownerName too long"),
  buyerName: z.string().max(255, "buyerName too long"),
  offerName: z.string().max(255, "offerName too long"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Example usage
// const validatedData = offerResultSchema.parse(req.body);
