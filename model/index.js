import sequelize from "../config/db.js";
import Plan from "./planModel/planModel.js";
import User from "./user/user.model.js";
// (If you want associations later, you can add here)
// Example: Plan.hasMany(Subscription);

export {
  sequelize,
  User,
  Plan,
};
