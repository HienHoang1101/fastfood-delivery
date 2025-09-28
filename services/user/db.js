const { Sequelize } = require('sequelize');


const sequelize = new Sequelize(
  process.env.DB_NAME || 'user_db',  // Tên database
  process.env.DB_USER || 'postgres', // Tên người dùng
  process.env.DB_PASSWORD || 'password', // Mật khẩu
  {
    host: process.env.DB_HOST || 'localhost', // Host PostgreSQL
    dialect: 'postgres', // PostgreSQL dialect
    port: process.env.DB_PORT || 5432, // Port PostgreSQL
    logging: false, // Tắt logging (hoặc bật nếu cần)
  }
);

module.exports = sequelize;
