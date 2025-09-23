import { asyncHandler } from "../../handlers/asyncHandler.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { locationSchema } from "../../schemaValidation/locationValidation.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";
import { Location } from "../../model/index.js";
// Create a new Location (only Business Owners)
export const createLocation = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]); // Throws error if not authorized

  const validation = locationSchema.safeParse(req.body);
  if (!validation.success) {
    return errorResponse(res, 400, "Validation failed", validation.error.issues);
  }

  const existingLocation = await Location.findOne({ where: { code: req.body.code } });
  if (existingLocation) {
    return errorResponse(res, 409, `Location with code '${req.body.code}' already exists`);
  }

  const location = await Location.create(req.body);
  return successResponse(res, 201, "Location created successfully", location);
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
export const updateLocation = asyncHandler(async (req, res) => {
  authorizeRoles(req, ["business_owner"]);

  const location = await Location.findByPk(req.params.id);
  if (!location) return errorResponse(res, 404, "Location not found");

  const validation = locationSchema.safeParse(req.body);
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


