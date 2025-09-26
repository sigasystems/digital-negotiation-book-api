import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import OfferBuyer from "./OfferBuyer.model.js"; 

const OfferVersion = sequelize.define(
  "OfferVersion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    offerBuyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: OfferBuyer,
        key: "id",
      },
      onDelete: "CASCADE",
      field: "offer_buyer_id", // <-- map camelCase to DB column
    },
    offerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "offer_name",
    },
    versionNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "version_no", // <-- map if column in DB is snake_case
    },
    fromParty: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "from_party",
    },
    toParty: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "to_party",
    },

    // ---------------------------
    // Negotiation Details
    // ---------------------------
    productName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "product_name",
    },
    speciesName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "species_name",
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    plantApprovalNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "plant_approval_number",
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
      field: "payment_terms",
    },
    sizeBreakups: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: "size_breakups",
    },
    grandTotal: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "grand_total",
    },
    shipmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "shipment_date",
    },
    remark: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // ---------------------------
    // System Fields
    // ---------------------------
    status: {
      type: DataTypes.ENUM("open", "accepted", "rejected"),
      defaultValue: "open",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    tableName: "offer_versions",
    timestamps: true,
    indexes: [{ fields: ["offer_buyer_id"] }], // use DB column name
  }
);

// Associations
OfferBuyer.hasMany(OfferVersion, { foreignKey: "offerBuyerId", as: "versions" });
OfferVersion.belongsTo(OfferBuyer, { foreignKey: "offerBuyerId", as: "offerBuyer" });

export default OfferVersion;
