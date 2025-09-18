import { asyncHandler } from "../../handlers/asyncHandler.js";
import Payment from "../../model/paymentModel/payment.model.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";

// Create a payment
export const createPayment = asyncHandler(async (req, res) => {
  const { userId, planId, amount, currency, paymentMethod, transactionId, status } = req.body;

  const payment = await Payment.create({
    userId,
    planId,
    amount,
    currency,
    paymentMethod,
    transactionId,
    status,
    paidAt: status === "success" ? new Date() : null,
  });

  return successResponse(res, 201,  "Payment created successfully",payment);
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
