// routes/planRoutes.js
import express from "express";
import { planController } from "../../controller/index.js";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
// import { authenticateJWT } from "../middlewares/authenticateJWT.js";

const router = express.Router();

// Public routes
router.get("/getall-plans", planController.getPlans);        
router.get("/:id", planController.getPlanById);  

// Admin routes
// Add `authenticateJWT` (or your admin middleware) when ready
router.post("/create-plan", authenticateJWT, planController.createPlan);             
router.put("/update-plan/:id", authenticateJWT ,planController.updatePlan);           
router.delete("/delete-plan/:id", authenticateJWT ,planController.deletePlan);        
router.patch("/:id/toggle",authenticateJWT , planController.togglePlanStatus); 

export default router;
