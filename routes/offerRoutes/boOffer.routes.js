import express from "express";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import {boOfferControllers} from "../../controller/index.js"

const router = express.Router()

const {createOffer, sendOffer, updateOffer, closeOffer, deleteOffer, openOffer, getAllOffers, getOfferById, searchOffers } = boOfferControllers

router.use(authenticateJWT)
router.post("/create-offer/:id", createOffer)
router.get("/get-all-offers",getAllOffers)
router.get("/get-offer/:id",getOfferById )
router.patch("/update-offer/:id", updateOffer)
router.patch("/close-offer/:id", closeOffer)
router.patch("/open-offer/:id", openOffer)
router.delete("/delete-offer/:id", deleteOffer)
router.get("/search-offer", searchOffers)
router.post("/send-offer/:id", sendOffer)

export default router