import express from "express";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { businessOwnerControllers } from "../../controller/index.js";

const router = express.Router()

const {becomeBusinessOwner, getAllBuyers, getBuyerById, searchBuyers} = businessOwnerControllers

router.post('/become-business-owner', becomeBusinessOwner)
router.get("/get-all-buyers",authenticateJWT, getAllBuyers)
router.get("/get-buyer/:id",authenticateJWT, getBuyerById)
router.get("/:ownerId/buyers/search",authenticateJWT, searchBuyers);

export default router