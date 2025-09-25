import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Plan = sequelize.define(
  "Plan",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isIn: [["trial", "basic", "pro" ,"custom"]], // extendable
      },
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },

    priceMonthly: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      validate: { min: 0 },
    },

    priceYearly: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      validate: { min: 0 },
    },

    currency: {
      type: DataTypes.STRING,
      defaultValue: "USD",
    },

    billingCycle: {
      type: DataTypes.ENUM("monthly", "yearly"),
      defaultValue: "monthly",
    },

    // Limits
    maxUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: { min: 0 },
    },

    maxProducts: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: { min: 0 },
    },

    maxOffers: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      validate: { min: 0 },
    },

    maxBuyers: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: { min: 0 },
    },

    // Features (stored as JSON in Postgres/MySQL)
    features: {
      type: DataTypes.JSONB, // use JSON if your DB doesn’t support JSONB
      defaultValue: {},
    },

    trialDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 },
    },

    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
  },
  {
    tableName: "plans",
    timestamps: true, // adds createdAt & updatedAt
  }
);

export default Plan;
