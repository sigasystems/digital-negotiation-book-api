import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import BusinessOwner from "../businessOwner/businessOwner.model.js";

const Buyer = sequelize.define(
  "Buyer",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Sequelize generates UUID v4
      primaryKey: true,
    },

    // 🔗 Tenant relation
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: BusinessOwner,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    // 🏢 Company Identity
    buyersCompanyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Company registration or license number",
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Optional tax/VAT/GST ID",
    },

    // 👤 Primary Contact Person
    contactName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^\+[1-9]\d{0,3}$/,
      },
      comment: "E.164 format country calling code (e.g., +1, +44, +91)",
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [4, 20],
        is: /^[0-9\-() ]*$/i,
      },
    },

    // 🌍 Address Info
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

    // ⚙️ System fields
    status: {
      type: DataTypes.ENUM("active", "inactive", "suspended"),
      defaultValue: "active",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Verified by business owner or platform admin",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Verified by business owner or platform admin",
    }
  },
  {
    tableName: "buyers",
    timestamps: true, // createdAt & updatedAt
    paranoid: false,  // adds deletedAt
    underscored: false, // this makes Sequelize use snake_case automatically
    indexes: [
      { fields: ["ownerId"] },
      { unique: true, fields: ["registrationNumber"] },
      { fields: ["buyersCompanyName"] }, // fixed column name
      { fields: ["contactEmail"] },
    ],
  }
);

// 🔗 Associations
BusinessOwner.hasMany(Buyer, { foreignKey: "ownerId", as: "buyers" });
Buyer.belongsTo(BusinessOwner, { foreignKey: "ownerId", as: "businessOwner" });

export default Buyer;
