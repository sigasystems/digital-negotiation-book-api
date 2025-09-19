import express from "express";
import { businessOwnerController } from "../../controller/index.js";


const router = express.Router();

// CRUD
router.post("/create-business-owner", businessOwnerController.createBusinessOwner);
router.get("/business-owners", businessOwnerController.getAllBusinessOwners);
router.get("/business-owner/:id", businessOwnerController.getBusinessOwnerById);
router.put("/business-owner/:id", businessOwnerController.updateBusinessOwner);
router.delete("/business-owner/:id", businessOwnerController.deleteBusinessOwner);

// Soft delete & restore
router.post("/business-owner/:id/restore", businessOwnerController.restoreBusinessOwner);

// Status
router.patch("/business-owner/:id/status", businessOwnerController.changeStatus);

// Approve / Reject
router.post("/business-owner/:id/approve", businessOwnerController.approveBusinessOwner);
router.post("/business-owner/:id/reject", businessOwnerController.rejectBusinessOwner);

export default router;
