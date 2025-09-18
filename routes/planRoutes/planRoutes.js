// routes/planRoutes.js
import express from "express";
import { planController } from "../../controller/index.js";
// import { authenticateJWT } from "../middlewares/authenticateJWT.js";

const router = express.Router();

// -------------------------
// 📌 Public routes
// -------------------------
router.get("/getall-plans", planController.getPlans);        // GET /api/plans
router.get("/:id", planController.getPlanById);  // GET /api/plans/:id

// -------------------------
// 📌 Admin routes
// -------------------------
// Add `authenticateJWT` (or your admin middleware) when ready
router.post("/create-plan", planController.createPlan);             // POST /api/plans
router.put("/update-plan/:id", planController.updatePlan);           // PUT /api/plans/:id
router.delete("/delete-plan/:id", planController.deletePlan);        // DELETE /api/plans/:id
router.patch("/:id/toggle", planController.togglePlanStatus); // PATCH /api/plans/:id/toggle

export default router;
