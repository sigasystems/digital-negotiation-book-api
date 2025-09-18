import * as model from "./model/index.js";
const { sequelize } = model;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected...");

    await sequelize.sync({ alter: true });

    console.log("✅ All models synchronized with database.");
    process.exit();
  } catch (error) {
    console.error("❌ Error syncing database:", error);
    process.exit(1);
  }
})();