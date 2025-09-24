import { asyncHandler } from "../../handlers/asyncHandler.js";
import { getPagination } from "../../handlers/pagination.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import Product from "../../model/product.model.js";
import { productsArraySchema, productSchema } from "../../schemaValidation/productValidation.js";
import { Op } from "sequelize";

export const createProducts = asyncHandler(async (req, res) => {
  // Validate array of products
  const validation = productsArraySchema.safeParse(req.body);
  if (!validation.success) {
    return errorResponse(res, 400, "Validation failed", validation.error.issues);
  }

  const productsToCreate = validation.data;

  // Check for duplicate codes in DB
  const codes = productsToCreate.map(p => p.code);
  const existingProducts = await Product.findAll({ where: { code: codes } });

  if (existingProducts.length > 0) {
    const existingCodes = existingProducts.map(p => p.code);
    return errorResponse(res, 409, `Products with codes already exist: ${existingCodes.join(", ")}`);
  }

  // Bulk create products
  const createdProducts = await Product.bulkCreate(productsToCreate);

  return successResponse(res, 201, "Products created successfully", createdProducts);
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

export const searchProduct = asyncHandler(async (req, res) => {
  const { query, code, productName, species, size } = req.query;
  const { limit, offset, page } = getPagination(req.query);
  // Build dynamic where clause
  const where = {};
  // Text search across multiple fields if 'query' is provided
  if (query) {
    where[Op.or] = [
      { code: { [Op.iLike]: `%${query}%` } },
      { productName: { [Op.iLike]: `%${query}%` } },
      { species: { [Op.iLike]: `%${query}%` } },
    ];
  }
  // Exact / field-specific filters
  if (code) where.code = { [Op.iLike]: `%${code}%` };
  if (productName) where.productName = { [Op.iLike]: `%${productName}%` };
  if (species) where.species = { [Op.iLike]: `%${species}%` };
  // Filter by size array if provided (Postgres array)
  if (size) {
    // size can be a single value or comma-separated list
    const sizes = Array.isArray(size) ? size : size.split(",");
    where.size = { [Op.overlap]: sizes }; // requires Postgres
  }
  // Fetch paginated results
  const { count, rows } = await Product.findAndCountAll({
    where,
    limit,
    offset,
    order: [["productName", "ASC"]],
  });
  const totalPages = Math.ceil(count / limit);
  return successResponse(res, 200, "Products retrieved successfully", {
    totalItems: count,
    totalPages,
    currentPage: page,
    products: rows,
  });
});