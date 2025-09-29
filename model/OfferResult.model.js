import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import {OfferVersion, Offer, Buyer, BusinessOwner} from "./index.js";

const OfferResult = sequelize.define(
  "OfferResult",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    offerVersionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: OfferVersion, key: "id" },
      onDelete: "CASCADE",
      field: "offer_version_id",
    },
    offerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Offer, key: "id" },
      onDelete: "CASCADE",
      field: "offer_id",
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: BusinessOwner, key: "id" },
      onDelete: "CASCADE",
      field: "owner_id",
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Buyer, key: "id" },
      onDelete: "CASCADE",
      field: "buyer_id",
    },
    isAccepted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        field: "is_accepted",
    },
    acceptedBy: {
      type: DataTypes.STRING(250),
      allowNull: true,
      field: "accepted_by",
    },
    isRejected: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        field: "is_rejected",
        },
    rejectedBy: {
      type: DataTypes.STRING(250),
      allowNull: true,
      field: "rejected_by",
    },
    ownerCompanyName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "owner_company_name",
    },
    buyerCompanyName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "buyer_company_name",
    },
    ownerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "owner_name",
    },
    buyerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "buyer_name",
    },
    offerName: {
      type: DataTypes.STRING(255),
      defaultValue: "Unnamed offer",
      field: "offer_name",
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
    tableName: "offer_result",
    timestamps: true,
  }
);

// Associations
OfferVersion.hasMany(OfferResult, { foreignKey: "offerVersionId", as: "results" });
OfferResult.belongsTo(OfferVersion, { foreignKey: "offerVersionId", as: "offerVersion" });

export default OfferResult;
