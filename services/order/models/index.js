const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Define associations
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
  onDelete: 'CASCADE'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

module.exports = {
  Order,
  OrderItem
};