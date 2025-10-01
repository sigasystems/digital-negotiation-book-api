import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { Offer, Buyer, BusinessOwner } from "../model/index.js";

const OfferBuyer = sequelize.define(
  "OfferBuyer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    offerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Offer,
        key: "id",
      },
      onDelete: "CASCADE",
      field: "offer_id",
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Buyer,
        key: "id",
      },
      onDelete: "CASCADE",
      field: "buyer_id",
    },

    // 👇 New ownerId column
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true, // nullable initially
      references: {
        model: BusinessOwner, // optional, only if you want FK constraint
        key: "id",
      },
      onDelete: "SET NULL", // if owner deleted, nullify
      field: "owner_id",
    },

    status: {
      type: DataTypes.ENUM("open", "accepted", "rejected", "countered", "close"),
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
    tableName: "offer_buyers",
    timestamps: true,
    indexes: [
      { fields: ["offer_id"] },
      { fields: ["buyer_id"] },
      { fields: ["owner_id"] }, // add index for faster lookup
    ],
  }
);

// Associations
Offer.hasMany(OfferBuyer, { foreignKey: "offerId", as: "offerBuyers" });
OfferBuyer.belongsTo(Offer, { foreignKey: "offerId", as: "offer" });

Buyer.hasMany(OfferBuyer, { foreignKey: "buyerId", as: "buyerOffers" });
OfferBuyer.belongsTo(Buyer, { foreignKey: "buyerId", as: "buyer" });

// Optional: link owner if needed
if (BusinessOwner) {
  BusinessOwner.hasMany(OfferBuyer, { foreignKey: "ownerId", as: "ownerOffers" });
  OfferBuyer.belongsTo(BusinessOwner, { foreignKey: "ownerId", as: "owner" });
}

export default OfferBuyer;
