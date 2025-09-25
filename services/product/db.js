// services/product/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'product_db', // Database name
  process.env.DB_USER || 'postgres',   // Database user
  process.env.DB_PASSWORD || 'password', // Database password
  {
    host: process.env.DB_HOST || 'localhost', // Database host
    dialect: 'postgres', // PostgreSQL dialect
    port: process.env.DB_PORT || 5432, // Database port
    logging: false, // Disable Sequelize logging for cleaner logs
  }
);

module.exports = sequelize;
