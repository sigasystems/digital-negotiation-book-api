import express from "express";
import  {productController}  from "../../controller/index.js";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
const router = express.Router();

router.post("/add-product", authenticateJWT, productController.createProducts);
router.get("/getall-products",  authenticateJWT, productController.getAllProducts);
router.get("/get-product/:id", authenticateJWT, productController.getProductById);
router.put("/update-product/:id",  authenticateJWT, productController.updateProduct);
router.delete("/delete-product/:id", authenticateJWT, productController.deleteProduct);
router.get("/search", productController.searchProduct);

export default router;
    