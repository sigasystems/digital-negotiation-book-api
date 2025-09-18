import { asyncHandler } from "../../handlers/asyncHandler.js";
import Payment from "../../model/paymentModel/payment.model.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import z from "zod";
import { paymentSchema } from "../../schemaValidation/paymentValidation.js";

// Create a payment
export const createPayment = asyncHandler(async (req, res) => {
  try {
    const validatedData = paymentSchema.parse(req.body);
    const payment = await Payment.create({
      ...validatedData,
      paidAt: validatedData.status === "success" ? new Date() : null,

    });
    return successResponse(res, 201, "Payment created successfully", payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        res,
        400,
        "Validation failed",
        error.issues.map((e) => e.message)
      );
    }
    return errorResponse(res, 500, "Something went wrong", error.message);
  }
});

// Get all payments
export const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.findAll({ include: ["User", "Plan"] });
  successResponse(res, 201, "All payments fetched",payments);
});

// Get single payment
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, { include: ["User", "Plan"] });
  if (!payment) return errorResponse(res, "Payment not found", 404);
  successResponse(res, 201, payment, "Payment fetched successfully");
});

// Update payment status
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) return errorResponse(res, "Payment not found", 404);

  payment.status = status;
  if (status === "success") payment.paidAt = new Date();
  await payment.save();

  successResponse(res, 201 ,payment, "Payment status updated");
});

// Delete payment
export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) return errorResponse(res, "Payment not found", 404);

  await payment.destroy();
  successResponse(res,201,  null, "Payment deleted successfully");
});
