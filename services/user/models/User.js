const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Import instance sequelize

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'users', // chắc chắn table name là "users"
  timestamps: true
});

module.exports = User;
