import express from "express";
import  {productController}  from "../../controller/index.js";
const router = express.Router();

router.post("/add-product", productController.createProduct);
router.get("/getall-products", productController.getAllProducts);
router.get("/get-product/:id", productController.getProductById);
router.put("/updated-product/:id", productController.updateProduct);
router.delete("/delete-product/:id", productController.deleteProduct);

export default router;
