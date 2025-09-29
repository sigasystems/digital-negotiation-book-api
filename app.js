import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { planRoutes, authRoutes, paymentRoutes, superadminRoutes, businessOwnersRoutes, boBuyersRoutes, offerDraftRoutes, boOfferRoutes, offerActionsRoutes } from "./routes/index.js"
import productRoutes from "./routes/productRoutes/product.routes.js"
import locationRoutes from "./routes/locationRoutes/location.routes.js"


import { notFoundHandler, errorHandler } from "./handlers/index.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(helmet())
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Routes
// -------------------------
app.use("/api/auth",authRoutes)
app.use("/api/plans", planRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/business-owner",businessOwnersRoutes)
app.use("/api/bo-buyer",boBuyersRoutes)
app.use("/api/offer-draft", offerDraftRoutes)
app.use("/api/product",productRoutes)
app.use("/api/location",locationRoutes)
app.use("/api/offer",boOfferRoutes)
app.use("/api/offer-actions",offerActionsRoutes)



app.use(notFoundHandler);
app.use(errorHandler);

export default app;
