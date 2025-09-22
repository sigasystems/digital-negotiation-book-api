import express from "express";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { businessOwnerControllers } from "../../controller/index.js";

const router = express.Router()


router.post('/become-business-owner', businessOwnerControllers.becomeBusinessOwner)
router.get("/get-all-buyers",authenticateJWT, businessOwnerControllers.getAllBuyers)
router.get("/get-buyer/:id",authenticateJWT, businessOwnerControllers.getBuyerById)
router.get("/:ownerId/buyers/search",authenticateJWT, businessOwnerControllers.searchBuyers);

export default router