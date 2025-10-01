const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['price']
    },
    {
      fields: ['stock']
    }
  ]
});

module.exports = Product;
