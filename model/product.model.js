import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Product = sequelize.define("Product", {
  id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  species: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  size: {
    type: DataTypes.ARRAY(DataTypes.STRING), // Array of sizes
    allowNull: true,
  },
}, {
  tableName: "products",
  timestamps: true,
});

export default Product;
