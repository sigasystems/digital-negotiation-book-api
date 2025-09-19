import express from "express";
import { businessOwnerController } from "../../controller/index.js";

const router = express.Router();

// CRUD
router.post("/create-business-owner", businessOwnerController.createBusinessOwner);  // Create
router.get("/business-owners", businessOwnerController.getAllBusinessOwners);       // Get all
router.get("/business-owner/:id", businessOwnerController.getBusinessOwnerById);    // Get by ID
router.put("/business-owner/:id", businessOwnerController.updateBusinessOwner);     // Update

// Soft delete / deactivate & activate
router.patch("/business-owner/:id/deactivate", businessOwnerController.deactivateBusinessOwner); // sets isDeleted = true, status = inactive
router.patch("/business-owner/:id/activate", businessOwnerController.activateBusinessOwner);     // sets isDeleted = false, status = active

// Approve / Reject
router.post("/business-owner/:id/approve", businessOwnerController.approveBusinessOwner);
router.post("/business-owner/:id/reject", businessOwnerController.rejectBusinessOwner);

export default router;
