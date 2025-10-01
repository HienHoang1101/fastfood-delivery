// models/Order.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: true
    }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Order;
