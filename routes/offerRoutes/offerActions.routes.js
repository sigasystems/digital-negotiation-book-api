import express from "express";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { offerActionsControllers } from "../../controller/index.js";

const router = express.Router()

const {respondOffer, sendOffer} = offerActionsControllers

router.use(authenticateJWT)
router.post("/:id", respondOffer)
router.post("/send-offer/:id", sendOffer)

export default router