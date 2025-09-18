import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import planRoutes from "./routes/planRoutes/planRoutes.js";
import authRoutes from "./routes/authRoutes/auth.routes.js"
import { notFoundHandler, errorHandler } from "./handlers/index.js";
dotenv.config();
const app = express();

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Routes
// -------------------------
app.use("/api/auth",authRoutes)
app.use("/api/plans", planRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
