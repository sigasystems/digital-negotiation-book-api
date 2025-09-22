import express from "express";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { businessOwnerController } from "../../controller/index.js";

const router = express.Router();

// CRUD
router.post("/create-business-owner",authenticateJWT, businessOwnerController.createBusinessOwner);  // Create
router.get("/business-owners",authenticateJWT, businessOwnerController.getAllBusinessOwners);       // Get all
router.get("/business-owner/:id",authenticateJWT, businessOwnerController.getBusinessOwnerById);    // Get by ID
router.put("/business-owner/:id", businessOwnerController.updateBusinessOwner);     // Update

// Soft delete / deactivate & activate
router.patch("/business-owner/:id/deactivate",authenticateJWT, businessOwnerController.deactivateBusinessOwner); // sets isDeleted = true, status = inactive
router.patch("/business-owner/:id/activate", businessOwnerController.activateBusinessOwner);     // sets isDeleted = false, status = active

// Approve / Reject
router.post("/business-owner/:id/approve",authenticateJWT, businessOwnerController.approveBusinessOwner);
router.post("/business-owner/:id/reject",authenticateJWT, businessOwnerController.rejectBusinessOwner);

export default router;
