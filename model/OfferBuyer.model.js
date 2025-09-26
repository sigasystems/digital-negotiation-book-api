import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { Offer, Buyer } from "../model/index.js";

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
      field: "offer_id", // <-- map to DB column
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Buyer,
        key: "id",
      },
      onDelete: "CASCADE",
      field: "buyer_id", // <-- map to DB column
    },
    status: {
      type: DataTypes.ENUM("open", "accepted", "rejected", "countered", "close"),
      defaultValue: "open",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at", // <-- map to DB column
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updated_at", // <-- map to DB column
    },
  },
  {
    tableName: "offer_buyers",
    timestamps: true,
    indexes: [
      { fields: ["offer_id"] },
      { fields: ["buyer_id"] },
    ],
  }
);


// Associations
Offer.hasMany(OfferBuyer, { foreignKey: "offerId", as: "offerBuyers" });
OfferBuyer.belongsTo(Offer, { foreignKey: "offerId", as: "offer" });

Buyer.hasMany(OfferBuyer, { foreignKey: "buyerId", as: "buyerOffers" });
OfferBuyer.belongsTo(Buyer, { foreignKey: "buyerId", as: "buyer" });

export default OfferBuyer;
