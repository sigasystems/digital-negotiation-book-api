import app from "./app.js";
import sequelize from "./config/db.js";

async function startServer() {
  try {
    const PORT = process.env.PORT || 5000;

    await sequelize.authenticate();
    console.log("✅ Database connected...");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
        console.log(error)

    process.exit()
  }
}

startServer();
