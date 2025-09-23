import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";

const BusinessOwner = sequelize.define(
  "BusinessOwner",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    // Personal info from User table
    first_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },

    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {
    tableName: "business_owners",
    timestamps: true,
    paranoid: false,
    indexes: [
      { unique: true, fields: ["email"] },
      { unique: true, fields: ["registrationNumber"] },
      { fields: ["userId"] },
    ],
  }
);

// Associations
User.hasOne(BusinessOwner, { foreignKey: "userId", as: "businessOwner" });
BusinessOwner.belongsTo(User, { foreignKey: "userId", as: "user" });

export default BusinessOwner;
