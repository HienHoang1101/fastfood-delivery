const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: true
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  payment_method: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'cash', 'e_wallet'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refunded_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['transaction_id']
    }
  ]
});

module.exports = Payment;
