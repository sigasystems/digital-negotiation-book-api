import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const BusinessOwner = sequelize.define(
  "BusinessOwner",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
      validate: {
        len: [10, 20],
        is: /^[0-9+\-() ]*$/i,
      },
    },

    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    businessType: {
      type: DataTypes.ENUM("wholesaler", "retailer", "farmer", "exporter"),
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
      type: DataTypes.ENUM("active", "inactive", "suspended"),
      defaultValue: "active",
    },

    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "business_owners",
    timestamps: true, // Sequelize manages createdAt & updatedAt
    paranoid: true,   // adds deletedAt for soft delete
    indexes: [
      { unique: true, fields: ["email"] },
      { unique: true, fields: ["registrationNumber"] },
    ],
  }
);

export default BusinessOwner;
