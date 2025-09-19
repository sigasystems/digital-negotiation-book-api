import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import planRoutes from "./routes/planRoutes/plan.routes.js";
import authRoutes from "./routes/authRoutes/auth.routes.js"
import paymentRoutes from "./routes/paymentRoutes/payment.routes.js"
import superadminRoutes from "./routes/superadminRoutes/superadmin.routes.js"



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



app.use(notFoundHandler);
app.use(errorHandler);

export default app;
