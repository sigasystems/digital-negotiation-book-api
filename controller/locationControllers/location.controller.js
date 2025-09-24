import { asyncHandler } from "../../handlers/asyncHandler.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { locationsArraySchema, locationSchema } from "../../schemaValidation/locationValidation.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";
import { Location } from "../../model/index.js";
import z from "zod";
import { Op } from "sequelize";
import { getPagination } from "../../handlers/pagination.js";
// Create a new Location (only Business Owners)

export const createLocations = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  // Validate request body (array of locations)
  const validation = locationsArraySchema.safeParse(req.body);
  if (!validation.success) {
    return errorResponse(res, 400, "Validation failed", validation.error.issues);
  }

  const locationsToCreate = validation.data;

  // Check for duplicate codes in DB
  const codes = locationsToCreate.map((loc) => loc.code);
  const existingLocations = await Location.findAll({ where: { code: codes } });
  if (existingLocations.length > 0) {
    const existingCodes = existingLocations.map((loc) => loc.code);
    return errorResponse(
      res,
      409,
      `Locations with codes already exist: ${existingCodes.join(", ")}`
    );
  }

  // Bulk create locations
  const createdLocations = await Location.bulkCreate(locationsToCreate);

  return successResponse(res, 201, "Locations created successfully", createdLocations);
});

// Get all Locations
export const getAllLocations = asyncHandler(async (req, res) => {
  const locations = await Location.findAll();
  return successResponse(res, 200, "Locations retrieved successfully", locations);
});

// Get single Location by ID
export const getLocationById = asyncHandler(async (req, res) => {
  const location = await Location.findByPk(req.params.id);
  if (!location) return errorResponse(res, 404, "Location not found");
  return successResponse(res, 200, "Location retrieved successfully", location);
});

// Update a Location (only Business Owners)
export const locationUpdateSchema = z.object({
  locationName: z.string().optional(),
  code: z.string().optional(),
  portalCode: z.string().optional(),
  country: z.string().optional()
});

export const updateLocation = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const location = await Location.findByPk(req.params.id);
  if (!location) return errorResponse(res, 404, "Location not found");

  const validation = locationUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return errorResponse(res, 400, "Validation failed", validation.error.issues);
  }

  // Check for duplicate code if code is being updated
  if (req.body.code && req.body.code !== location.code) {
    const existingLocation = await Location.findOne({ where: { code: req.body.code } });
    if (existingLocation) {
      return errorResponse(res, 409, `Location with code '${req.body.code}' already exists`);
    }
  }

  await location.update(req.body);
  return successResponse(res, 200, "Location updated successfully", location);
});

// Delete a Location (only Business Owners)
export const deleteLocation = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const location = await Location.findByPk(req.params.id);
  if (!location) return errorResponse(res, 404, "Location not found");

  await location.destroy();
  return successResponse(res, 200, "Location deleted successfully");
});

//search with pagination advanced
export const searchLocations = asyncHandler(async (req, res) => {
  const { query, country, code, portalCode } = req.query;
  const { limit, offset, page } = getPagination(req.query);
  // Build where clause dynamically
  const where = {};
  // Text search across multiple fields
  if (query) {
    where[Op.or] = [
      { locationName: { [Op.iLike]: `%${query}%` } },
      { code: { [Op.iLike]: `%${query}%` } },
      { portalCode: { [Op.iLike]: `%${query}%` } },
      { country: { [Op.iLike]: `%${query}%` } },
    ];
  }
  // Filter by specific fields
  if (country) where.country = country;
  if (code) where.code = code;
  if (portalCode) where.portalCode = portalCode;
  // Fetch paginated results
  const { count, rows } = await Location.findAndCountAll({
    where,
    limit,
    offset,
    order: [["locationName", "ASC"]],
  });
  const totalPages = Math.ceil(count / limit);
  return successResponse(res, 200, "Locations fetched successfully", {
    totalItems: count,
    totalPages,
    currentPage: page,
    locations: rows,
  });
});

