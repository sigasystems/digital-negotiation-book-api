import sequelize from "../config/db.js";
import Plan from "./plan.model.js";
import User from "./user.model.js";
import Payment from "./payment.model.js";
import BusinessOwner from "./businessOwner.model.js"
import Buyer from "./buyers.model.js";
import Role from "./roles.model.js";
// (If you want associations later, you can add here)
// Example: Plan.hasMany(Subscription);

export {
  sequelize,
  User,
  Plan,
  Payment,
  BusinessOwner,
  Buyer,
  Role
};
