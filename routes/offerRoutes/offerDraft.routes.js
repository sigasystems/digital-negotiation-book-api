import express from "express";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { offerDraftControllers } from "../../controller/index.js";

const {
  createOffer,
  getAllOfferDrafts,
  getOfferDraftById,
  updateOfferDraft,
  deleteOfferDraft,
  updateOfferStatus,
  searchOfferDrafts
} = offerDraftControllers;

const router = express.Router();

router.use(authenticateJWT);
router.post("/create-draft", createOffer);
router.get("/get-all-drafts", getAllOfferDrafts);
router.get("/get-draft/:id", getOfferDraftById);
router.patch("/update-draft/:id", updateOfferDraft);
router.delete("/delete-draft/:id", deleteOfferDraft);
router.patch("/:id/status", updateOfferStatus);
router.get("/search", searchOfferDrafts);

export default router;
