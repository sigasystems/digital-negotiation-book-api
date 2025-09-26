import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import BusinessOwner from "./businessOwner.model.js";

const Offerdraft = sequelize.define(
  "Offerdraft",
  {
    // ---------------------------
    // About Business Owner Section
    // ---------------------------
    draftNo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    businessOwnerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: BusinessOwner,
        key: "id",
      },
      onDelete: "CASCADE"
    },
    fromParty: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    origin: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    processor: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    plantApprovalNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    // ---------------------------
    // About Draft Section
    // ---------------------------
    draftName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    offerValidityDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shipmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    grandTotal: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tolerance: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // ---------------------------
    // Product Info Section
    // ---------------------------
    productName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    speciesName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    packing: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // ---------------------------
    // Sizes/Breakups Section
    // ---------------------------
    sizeBreakups: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    total: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    // ---------------------------
    // System Fields
    // ---------------------------
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("open", "close"),
      defaultValue: "open",
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
    deletedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "offers_draft",
    timestamps: true,
    paranoid: false,
    indexes: [{ fields: ["businessOwnerId"] }],
  }
);

// Associations
BusinessOwner.hasMany(Offerdraft, { foreignKey: "businessOwnerId", as: "drafts" });
Offerdraft.belongsTo(BusinessOwner, { foreignKey: "businessOwnerId", as: "businessOwner" });

export default Offerdraft;
