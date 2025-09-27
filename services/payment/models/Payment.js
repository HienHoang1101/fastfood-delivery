// services/payment/models/Payment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Payment = sequelize.define('Payment', {
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('initiated', 'completed', 'failed'),
    defaultValue: 'initiated',
  },
}, {
  tableName: 'payments',
  underscored: true,   // Use snake_case for column names
});

module.exports = Payment;
