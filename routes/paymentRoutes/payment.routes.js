import express from "express";
import { paymentController } from "../../controller/index.js";
import { stripeWebhook } from "../../controller/webhookControllers/stripeWebhook.js";

const router = express.Router();

router.post("/create-payment", paymentController.createPayment);
router.get("/getallpayments", paymentController.getPayments);
router.get("/:id", paymentController.getPaymentById);
// Route
router.patch("/:id/status", paymentController.updatePaymentStatus);
router.delete("/:id", paymentController.deletePayment);
// Webhook → needs raw body
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);
//----stripe
router.get("/stripe/all", paymentController.getAllStripePayments);
router.get("/payments/search", paymentController.searchStripePayments);      // filter by email/status

export default router;
