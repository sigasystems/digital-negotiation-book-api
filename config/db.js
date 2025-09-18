import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // useful for Render/Heroku/Supabase
          },
        }
      : {}, // 👈 no SSL locally
    pool: {
      max: 5,
      min: 2,
      idle: 10000,
      acquire: 30000,
    },
  }
);

export default sequelize;
