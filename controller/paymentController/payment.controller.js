import { asyncHandler } from "../../handlers/asyncHandler.js";
import { Payment, Plan, User } from "../../model/index.js";
import {
  successResponse,
  errorResponse,
} from "../../handlers/responseHandler.js";
import z from "zod";
import { paymentSchema } from "../../schemaValidation/paymentValidation.js";
import { formatDate } from "../../utlis/dateFormatter.js";
import stripe from "../../config/stripe.js";
import formatTimestamps from "../../utlis/formatTimestamps.js";
//---------------create payment-----------
export const createPayment = asyncHandler(async (req, res) => {
  try {
    const { isStripe, planId, userId, ...manualData } = req.body;

    // ---------------- STRIPE PAYMENT ----------------
    if (isStripe) {
      if (!planId || !userId)
        return errorResponse(res, 400, "planId and userId are required for Stripe payment");

      const user = await User.findByPk(userId);
      const plan = await Plan.findByPk(planId);

      if (!user || !plan)
        return errorResponse(res, 404, "User or Plan not found");

      const amount = plan.billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
      if (!amount || amount <= 0)
        return errorResponse(res, 400, "Plan price must be greater than zero");

      const stripeInterval = plan.billingCycle === "monthly" ? "month" : "year";

      // 1️⃣ Create pending payment in DB
      const payment = await Payment.create({
        userId: user.id,
        planId: plan.id,
        amount: amount,
        status: "pending",
        transactionId: `pending_${Date.now()}`,
        paymentMethod: "card",
      });

      // 2️⃣ Create Stripe product & price dynamically
      const stripeProduct = await stripe.products.create({
        name: plan.name,
        metadata: { planId: plan.id, userId: user.id },
      });

      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(amount * 100),
        currency: plan.currency || "usd",
        recurring: { interval: stripeInterval },
        product: stripeProduct.id,
      });

      // 3️⃣ Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        success_url: `https://example.com/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://example.com/cancel`,
        metadata: { paymentId: payment.id, planId: plan.id },
      });

      return successResponse(res, 201, "Stripe Checkout initiated", {
        checkoutUrl: session.url,
        payment: formatTimestamps(payment.toJSON()),
      });
    }

    // ---------------- MANUAL PAYMENT ----------------
    const parsed = paymentSchema.safeParse(manualData);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return errorResponse(res, 400, "Validation Error", errors);
    }

    const payment = await Payment.create(parsed.data);
    return successResponse(res,201,"Manual Payment created successfully",formatTimestamps(payment.toJSON()));
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const fields = error.errors.map((e) => ({
        field: e.path,
        message: `${e.path} must be unique: "${e.value}"`,
      }));
      return errorResponse(res, 400, "Duplicate Value Error", fields);
    }

    if (error.name === "SequelizeValidationError") {
      const fields = error.errors.map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return errorResponse(res, 400, "Database Validation Error", fields);
    }
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
});
// ---------------- GET ALL PAYMENTS ----------------
export const getPayments = asyncHandler(async (req, res) => {
  try {
    const payments = await Payment.findAll({ include: ["User", "Plan"] });

    const formattedPayments = payments.map((payment) => {
      const p = payment.toJSON();
      p.createdAt = formatDate(p.createdAt);
      p.updatedAt = formatDate(p.updatedAt);
      return p;
    });
    return successResponse(res, 200, "Payments fetched successfully", {
      total: formattedPayments.length,
      payments: formattedPayments,
    });
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
});   

// ---------------- GET PAYMENT BY ID ----------------
export const getPaymentById = asyncHandler(async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: ["User", "Plan"],
    });

    if (!payment) {
      return errorResponse(res, 404, "Payment not found");
    }

    const p = payment.toJSON();
    p.createdAt = formatDate(p.createdAt);
    p.updatedAt = formatDate(p.updatedAt);

    return successResponse(res, 200, "Payment fetched successfully", p);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
});

// ---------------- UPDATE PAYMENT STATUS ----------------
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  try {
    const statusSchema = z.enum(["pending", "success", "failed", "canceled"]);
    const parsed = statusSchema.safeParse(req.body.status);

    if (!parsed.success) {
      return errorResponse(res, 400, "Invalid payment status", [
        { field: "status",message: "Must be one of pending, success, failed, canceled" },
      ]);
    }

    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return errorResponse(res, 404, "Payment not found");

    payment.status = parsed.data;
    if (parsed.data === "success") {
      payment.paidAt = new Date();
    }
    await payment.save();

    const p = payment.toJSON();
    p.createdAt = formatDate(p.createdAt);
    p.updatedAt = formatDate(p.updatedAt);

    return successResponse(res, 200, "Payment status updated successfully", p);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
});

// ---------------- DELETE PAYMENT ----------------
export const deletePayment = asyncHandler(async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return errorResponse(res, 404, "Payment not found");

    await payment.destroy();
    return successResponse(res, 200, "Payment deleted successfully", {
      id: req.params.id,
    });
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
});

///------------------Stripe ---------------------
export const getAllStripePayments = asyncHandler(async (req, res) => {
  try {
    // Fetch last 100 charges (pagination available)
    const charges = await stripe.charges.list({ limit: 100 });

    // Format relevant fields
    const payments = charges.data.map(c => ({
      id: c.id,
      amount: c.amount / 100, // convert cents to dollars
      currency: c.currency,
      status: c.status,
      customer_email: c.billing_details.email,
      description: c.description,
      created: new Date(c.created * 1000),
      payment_method: c.payment_method_details?.type,
    }));

    return res.status(200).json({ success: true, data: payments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- SEARCH CHARGES ----------------
export const searchStripePayments = asyncHandler(async (req, res) => {
  const { email, status } = req.query;
  try {
    let charges = [];
    let limit = 100; // max per request

    const allCharges = await stripe.charges.list({ limit });
    charges = allCharges.data;

    // Filter by email
    if (email) {
      charges = charges.filter(c => c.billing_details.email === email);
    }

    // Filter by status
    if (status) {
      charges = charges.filter(c => c.status === status);
    }

    const payments = charges.map(c => ({
      id: c.id,
      amount: c.amount / 100,
      currency: c.currency,
      status: c.status,
      customer_email: c.billing_details.email,
      description: c.description,
      created: new Date(c.created * 1000),
      payment_method: c.payment_method_details?.type,
    }));

    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
