import { asyncHandler } from "../../handlers/asyncHandler.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import Product from "../../model/product.model.js";
import { productSchema } from "../../schemaValidation/productValidation.js";

export const createProduct = asyncHandler(async (req, res) => {
  // Validate request body
  const validation = productSchema.safeParse(req.body);
  if (!validation.success) {
    return errorResponse(res, 400, "Validation failed", validation.error.issues);
  }

  // Check if product code already exists
  const existingProduct = await Product.findOne({ where: { code: req.body.code } });
  if (existingProduct) {
    return errorResponse(res, 409, `Product with code '${req.body.code}' already exists`);
  }

  // Create product
  const product = await Product.create(req.body);
  return successResponse(res, 201, "Product created successfully", product);
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll();
  return successResponse(res, 200, "Products retrieved successfully", products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return errorResponse(res, 404, "Product not found");

  return successResponse(res, 200, "Product retrieved successfully", product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return errorResponse(res, 404, "Product not found");

  // Validate request body
  const validation = productSchema.safeParse(req.body);
  if (!validation.success) {
    return errorResponse(res, 400, "Validation failed", validation.error.issues);
  }

  // Check for duplicate code if updating
  if (req.body.code && req.body.code !== product.code) {
    const existingProduct = await Product.findOne({ where: { code: req.body.code } });
    if (existingProduct) {
      return errorResponse(res, 409, `Product with code '${req.body.code}' already exists`);
    }
  }

  // Update product
  await product.update(req.body);
  return successResponse(res, 200, "Product updated successfully", product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return errorResponse(res, 404, "Product not found");

  await product.destroy();
  return successResponse(res, 200, "Product deleted successfully");
});

