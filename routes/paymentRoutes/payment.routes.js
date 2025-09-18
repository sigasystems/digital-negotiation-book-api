import express from "express";
import { paymentController } from "../../controller/index.js";

const router = express.Router();

router.post("/create-payment", paymentController.createPayment);
router.get("/getallpayments", paymentController.getPayments);
router.get("/:id", paymentController.getPaymentById);
router.patch("/:id/status", paymentController.updatePaymentStatus);
router.delete("/:id", paymentController.deletePayment);

export default router;
