import express from "express";
import { locationController } from "../../controller/index.js";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";

const router = express.Router();

router.post("/add-location", authenticateJWT, locationController.createLocations);
router.get("/getall-locations",authenticateJWT, locationController.getAllLocations);
router.get("/getlocation/:id", authenticateJWT , locationController.getLocationById);
router.put("/update-location/:id", authenticateJWT , locationController.updateLocation);
router.delete("/delete-location/:id", authenticateJWT ,locationController.deleteLocation);
router.get("/search", authenticateJWT , locationController.searchLocations);

export default router;
