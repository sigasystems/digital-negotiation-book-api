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

// ---------------- CREATE PAYMENT ----------------
// export const createPayment = asyncHandler(async (req, res) => {
//   try {
//     const parsed = paymentSchema.safeParse(req.body);
//     if (!parsed.success) {
//       const errors = parsed.error.issues.map((e) => ({
//         field: e.path.join("."),
//         message: e.message,
//       }));
//       return errorResponse(res, 400, "Validation Error", errors);
//     }
//     const payment = await Payment.create(parsed.data);
//     return successResponse(res,201,"Payment created successfully",payment.toJSON());
//   } catch (error) {
//     // Sequelize Unique Constraint Error
//     if (error.name === "SequelizeUniqueConstraintError") {
//       const fields = error.errors.map((e) => ({
//         field: e.path,
//         message: `${e.path} must be unique. "${e.value}" already exists.`,
//       }));
//       return errorResponse(res, 400, "Duplicate Value Error", fields);
//     }

//     // Sequelize Validation Error
//     if (error.name === "SequelizeValidationError") {
//       const fields = error.errors.map((e) => ({
//         field: e.path,
//         message: e.message,
//       }));
//       return errorResponse(res, 400, "Database Validation Error", fields);
//     }
//     // General error
//     return errorResponse(res, 500, "Internal Server Error", error.message);
//   }
// });

// ---------------- CREATE PAYMENT (MANUAL OR STRIPE) ----------------
export const createPayment = asyncHandler(async (req, res) => {
  try {
    const { isStripe, planId, userId, ...manualData } = req.body;

    // ---------------- STRIPE PAYMENT ----------------
    if (isStripe) {
      if (!planId || !userId)
        return errorResponse(
          res,
          400,
          "planId and userId are required for Stripe payment"
        );

      // 1. Find user & plan
      const user = await User.findByPk(userId);
      const plan = await Plan.findByPk(planId);

      if (!user || !plan)
        return errorResponse(res, 404, "User or Plan not found");

      // 2. Determine amount based on billing cycle
      const amount =
        plan.billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
      if (!amount || amount <= 0)
        return errorResponse(res, 400, "Plan price must be greater than zero");

      const stripeInterval = plan.billingCycle === "monthly" ? "month" : "year";

      // 3. Create pending payment in DB
      const payment = await Payment.create({
        userId: user.id,
        planId: plan.id,
        amount: amount,
        status: "pending",
        transactionId: `pending_${Date.now()}`,
      });

      // 4. Dynamically create Stripe product & price
      const stripeProduct = await stripe.products.create({
        name: plan.name,
        metadata: { planId: plan.id },
      });

      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(amount * 100), // in cents
        currency: plan.currency || "usd",
        recurring: { interval: stripeInterval },
        product: stripeProduct.id,
      });

      // 5. Create Stripe checkout session with placeholder URLs
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
        paymentId: payment.id,
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
    return successResponse(res,201,"Payment created successfully",payment.toJSON());
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
