import { BusinessOwner } from "../../model/index.js";
import {
  businessOwnerSchema
} from "../../schemaValidation/businessValidation.js";
// ✅ Create a new Business Owner
export const createBusinessOwner = async (req, res) => {
  try {
    const validatedData = businessOwnerSchema.parse(req.body); // ✅ validation
    const owner = await BusinessOwner.create(validatedData);
    res.status(201).json({ success: true, data: owner });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.errors ? error.errors.map((e) => e.message) : error.message,
    });
  }
};

// ✅ Get all Business Owners
export const getAllBusinessOwners = async (req, res) => {
  try {
    const owners = await BusinessOwner.findAll({ paranoid: false });
    res.json({ success: true, data: owners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Business Owner by ID
export const getBusinessOwnerById = async (req, res) => {
  try {
    const owner = await BusinessOwner.findByPk(req.params.id, { paranoid: false });
    if (!owner) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: owner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Business Owner
export const updateBusinessOwner = async (req, res) => {
  try {
    const validatedData = businessOwnerSchema.parse(req.body); // ✅ validation

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return res.status(404).json({ success: false, message: "Not found" });

    await owner.update(validatedData);
    res.json({ success: true, data: owner });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.errors ? error.errors.map((e) => e.message) : error.message,
    });
  }
};

// ✅ Soft Delete
export const deleteBusinessOwner = async (req, res) => {
  try {
    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return res.status(404).json({ success: false, message: "Not found" });

    await owner.destroy(); // soft delete
    res.json({ success: true, message: "Business owner soft-deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Restore soft-deleted
export const restoreBusinessOwner = async (req, res) => {
  try {
    const owner = await BusinessOwner.findByPk(req.params.id, { paranoid: false });
    if (!owner) return res.status(404).json({ success: false, message: "Not found" });

    await owner.restore();
    res.json({ success: true, message: "Business owner restored" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Change Status
export const changeStatus = async (req, res) => {
  try {
    const { status } = businessOwnerSchema.parse(req.body); // ✅ validation

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return res.status(404).json({ success: false, message: "Not found" });

    owner.status = status;
    await owner.save();

    res.json({ success: true, data: owner });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.errors ? error.errors.map((e) => e.message) : error.message,
    });
  }
};

// ✅ Approve Business Owner
export const approveBusinessOwner = async (req, res) => {
  try {
    await businessOwnerSchema.parseAsync(req.body); // optional reason validation

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return res.status(404).json({ success: false, message: "Not found" });

    owner.isVerified = true;
    owner.status = "active";
    await owner.save();

    res.json({ success: true, message: "Business owner approved", data: owner });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.errors ? error.errors.map((e) => e.message) : error.message,
    });
  }
};

// ✅ Reject Business Owner
export const rejectBusinessOwner = async (req, res) => {
  try {
    const { reason } = businessOwnerSchema.parse(req.body); // optional reason

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return res.status(404).json({ success: false, message: "Not found" });

    owner.isVerified = false;
    owner.status = "inactive";
    await owner.save();

    res.json({
      success: true,
      message: "Business owner rejected",
      reason: reason || null,
      data: owner,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.errors ? error.errors.map((e) => e.message) : error.message,
    });
  }
};
