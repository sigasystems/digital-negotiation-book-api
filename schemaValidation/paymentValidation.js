import { z } from "zod";

export const paymentSchema = z.object({
  userId: z.string().uuid({ message: "User ID must be a valid UUID" }),
  planId: z.string().uuid({ message: "Plan ID must be a valid UUID" }),
  amount: z.number().positive({ message: "Amount must be greater than 0" }),
  currency: z.string().min(1, { message: "Currency is required" }),
  status: z.enum(["pending", "success", "failed"], {
    message: "Status must be pending, success, or failed",
  }),
  paymentMethod: z.enum(["card", "upi", "netbanking", "wallet"], {
    message: "Invalid payment method",
  }),
  transactionId: z.string().min(1, { message: "Transaction ID is required" }),
});
