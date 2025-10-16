const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'order_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false,
    
    // Connection pool
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    
    // Retry on connection errors
    retry: {
      max: 3,
      match: [/ECONNREFUSED/, /ETIMEDOUT/, /SequelizeConnectionError/]
    },
    
    dialectOptions: {
      connectTimeout: 60000
    }
  }
);

module.exports = sequelize;
