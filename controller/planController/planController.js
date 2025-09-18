// controllers/planController.js

import Plan from "../../model/planModel.js";


// @desc Create a new plan
// @route POST /api/plans
// @access Admin
// controllers/planController.js

/**
 * Create a new plan
 */
export const createPlan = async (req, res) => {
  try {
    const {
      key,
      name,
      description,
      priceMonthly,
      priceYearly,
      currency,
      billingCycle,
      maxUsers,
      maxProducts,
      maxOffers,
      maxBuyers,
      features,
      trialDays,
      isDefault,
      isActive,
      sortOrder,
    } = req.body;

    // ✅ Validate required fields
    if (!key || !name) {
      return res.status(400).json({ message: "Key and Name are required." });
    }

    // ✅ Check if plan already exists
    const existing = await Plan.findOne({ where: { key } });
    if (existing) {
      return res.status(400).json({ message: `Plan with key "${key}" already exists.` });
    }

    // ✅ Create new plan
    const plan = await Plan.create({
      key,
      name,
      description,
      priceMonthly,
      priceYearly,
      currency,
      billingCycle,
      maxUsers,
      maxProducts,
      maxOffers,
      maxBuyers,
      features,
      trialDays,
      isDefault,
      isActive,
      sortOrder,
    });

    return res.status(201).json({ message: "Plan created succesfully!!!" });
  } catch (error) {
    console.error("Error creating plan:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// @desc Get all plans (optionally filter by active)
// @route GET /api/plans
// @access Public (for showing available plans)
export const getPlans = async (req, res) => {
  try {
    // const { activeOnly } = req.query;
    // const filter = activeOnly ? { isActive: true } : {};
    // const plans = await Plan.find(filter).sort({ sortOrder: 1 });
    // Fetch plans from DB
    const plans = await Plan.findAll();
        res.status(201).json({ message: "Get all plans sucesfully" ,plans });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * @desc   Get single plan by ID
 * @route  GET /api/plans/:id
 * @access Public
 */
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    return res.status(200).json(plan);
  } catch (error) {
    console.error("Error fetching plan:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc   Update plan
 * @route  PUT /api/plans/:id
 * @access Admin
 */
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const [updatedRows] = await Plan.update(req.body, {
      where: { id },
      returning: true, // works in Postgres
    });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const updatedPlan = await Plan.findByPk(id);
    return res.json(updatedPlan);
  } catch (error) {
    console.error("Error updating plan:", error);
    return res.status(400).json({ message: error.message });
  }
};

/**
 * @desc   Delete plan
 * @route  DELETE /api/plans/:id
 * @access Admin
 */
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRows = await Plan.destroy({ where: { id } });

    if (deletedRows === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    return res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc   Toggle plan active status
 * @route  PATCH /api/plans/:id/toggle
 * @access Admin
 */
export const togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    return res.json({
      message: `Plan is now ${plan.isActive ? "active" : "inactive"}`,
      plan,
    });
  } catch (error) {
    console.error("Error toggling plan status:", error);
    return res.status(500).json({ message: error.message });
  }
};
