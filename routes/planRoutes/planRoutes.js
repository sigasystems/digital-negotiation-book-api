// routes/planRoutes.js
import express from "express";

// import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { createPlan, deletePlan, getPlanById, getPlans, togglePlanStatus, updatePlan } from "../../controller/planController/planController.js";

const router = express.Router();

// Public routes
router.get("/getall-plans", getPlans);
router.get("/get-plan/:id", getPlanById);

// Admin routes (you can add auth middleware here later)
router.post("/create-plan",  createPlan);
router.put("/update-plan/:id", updatePlan);
router.delete("/:id", deletePlan);
router.patch("/:id/toggle", togglePlanStatus);

export default router;
