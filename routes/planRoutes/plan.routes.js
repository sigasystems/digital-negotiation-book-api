// routes/planRoutes.js
import express from "express";
import { planController } from "../../controller/index.js";
// import { authenticateJWT } from "../middlewares/authenticateJWT.js";

const router = express.Router();

// Public routes
router.get("/getall-plans", planController.getPlans);        
router.get("/:id", planController.getPlanById);  

// Admin routes
// Add `authenticateJWT` (or your admin middleware) when ready
router.post("/create-plan", planController.createPlan);             
router.put("/update-plan/:id", planController.updatePlan);           
router.delete("/delete-plan/:id", planController.deletePlan);        
router.patch("/:id/toggle", planController.togglePlanStatus); 

export default router;
