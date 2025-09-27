const { Sequelize } = require('sequelize');

// Kết nối tới PostgreSQL database với các biến môi trường
const sequelize = new Sequelize(
  process.env.DB_NAME || 'user_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false,  // Tắt logging của Sequelize
  }
);
module.exports = sequelize;
