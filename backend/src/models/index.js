const { sequelize } = require('../config/database');
const User = require('./User');
const Worker = require('./Worker');
const Salary = require('./Salary');
const Category = require('./Category');
const Product = require('./Product');
const StockMovement = require('./StockMovement');
const Client = require('./Client');
const Payment = require('./Payment');
const Notification = require('./Notification');

// ============================================
// Define Relationships
// ============================================

// User relationships
User.hasMany(Worker, { foreignKey: 'created_by', as: 'createdWorkers' });
User.hasMany(Salary, { foreignKey: 'created_by', as: 'createdSalaries' });
User.hasMany(StockMovement, { foreignKey: 'user_id', as: 'stockMovements' });
User.hasMany(Client, { foreignKey: 'created_by', as: 'createdClients' });
User.hasMany(Payment, { foreignKey: 'created_by', as: 'createdPayments' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// Worker relationships
Worker.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Worker.hasMany(Salary, { foreignKey: 'worker_id', as: 'salaries' });

// Salary relationships
Salary.belongsTo(Worker, { foreignKey: 'worker_id', as: 'worker' });
Salary.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Category relationships
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

// Product relationships
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'movements' });

// StockMovement relationships
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
StockMovement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Client relationships
Client.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Client.hasMany(Payment, { foreignKey: 'client_id', as: 'payments' });

// Payment relationships
Payment.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Payment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Notification relationships
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
    sequelize,
    User,
    Worker,
    Salary,
    Category,
    Product,
    StockMovement,
    Client,
    Payment,
    Notification
};
