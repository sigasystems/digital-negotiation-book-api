import sequelize from "../../config/db.js";
import { DataTypes } from "sequelize";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: sequelize.literal("gen_random_uuid()"),
    primaryKey: true,
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      is: /^[A-Za-z\s'-]{2,50}$/,
    },
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      is: /^[A-Za-z\s'-]{2,50}$/,
    },
  },
  company_name: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  country_code: {
    type: DataTypes.STRING(5),
    allowNull: true,
    validate: {
      is: /^\+[1-9]\d{0,3}$/,
    },
  },
  phone_number: {
  type: DataTypes.STRING(15),
  allowNull: true,
  unique: true,
  validate: {
    is: /^[0-9]{6,14}$/,
  },
},
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [60, 255],
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal("now()"),
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal("now()"),
  },
}, {
  tableName: "users",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ["email"],
    },
    {
      unique: true,
      fields: ["phone_number"],
    },
  ],
});

export default User
