import sequelize from "../config/db.js";
import planModel from "../model/planModel.js"
// (If you want associations later, you can add here)
// Example: Plan.hasMany(Subscription);

export {
  sequelize,
  planModel,
};
