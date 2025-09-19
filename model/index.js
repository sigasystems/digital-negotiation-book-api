import sequelize from "../config/db.js";
import Plan from "./planModel/plan.model.js";
import User from "./user/user.model.js";
import Payment from "./paymentModel/payment.model.js";
import BusinessOwner from "./businessOwner/businessOwner.model.js";
import Buyer from "./buyers/buyers.model.js";
// (If you want associations later, you can add here)
// Example: Plan.hasMany(Subscription);

export {
  sequelize,
  User,
  Plan,
  Payment,
  BusinessOwner,
  Buyer
};
