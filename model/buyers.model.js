import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import {BusinessOwner} from "./index.js";

const Buyer = sequelize.define('Buyer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // auto-generate if not provided
    primaryKey: true
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'business_owners',
      key: 'id'
    }
  },
  buyersCompanyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  registrationNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  countryCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: DataTypes.STRING,
  city: DataTypes.STRING,
  address: DataTypes.TEXT,
  postalCode: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'buyers'
});


// 🔗 Associations
BusinessOwner.hasMany(Buyer, { foreignKey: "ownerId", as: "buyers" });
Buyer.belongsTo(BusinessOwner, { foreignKey: "ownerId", as: "businessOwner" });

export default Buyer;
