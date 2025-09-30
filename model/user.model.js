import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";
import Role from "./roles.model.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: { is: /^[A-Za-z\s'-]{2,50}$/ },
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: { is: /^[A-Za-z\s'-]{2,50}$/ },
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { len: [60, 255] },
    },
    roleId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: 'roles', // PostgreSQL table name
    key: 'id',
  },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
},
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal("now()"),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal("now()"),
    },
  },
  {
    tableName: "users",
    timestamps: false,
    indexes: [{ unique: true, fields: ["email"] }],
  }
);

// 🔗 Associations
Role.hasMany(User, { foreignKey: "roleId", as: "users" });
User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

export default User;
