import express from "express";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { offerActionsControllers } from "../../controller/index.js";

const router = express.Router()

const {respondOffer, sendOffer, getRecentNegotiations, getLatestNegotiation} = offerActionsControllers

router.use(authenticateJWT)
router.get("/last-negotiations", getLatestNegotiation)
router.get("/all-negotiation", getRecentNegotiations)
router.post("/:id", respondOffer)
router.post("/send-offer/:id", sendOffer)

export default router