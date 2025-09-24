import express from "express";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { boBuyersControllers } from "../../controller/index.js";

const router = express.Router()

const {addBuyer, deleteBuyer, activateBuyer, deactivateBuyer, editBuyer} = boBuyersControllers

router.post("/add-buyer",authenticateJWT, addBuyer)
router.delete("/delete-buyer/:id",authenticateJWT, deleteBuyer)
router.patch("/activate-buyer/:id",authenticateJWT, activateBuyer)
router.patch("/deactivate-buyer/:id",authenticateJWT, deactivateBuyer)
router.patch("/edit-buyer/:id",authenticateJWT, editBuyer)

export default router

