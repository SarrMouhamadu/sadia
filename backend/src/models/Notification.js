const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Null = notification for all users'
    },
    type: {
        type: DataTypes.ENUM(
            'STOCK_ALERTE',
            'STOCK_RUPTURE',
            'STOCK_MOUVEMENT',
            'SALARY_CREATED',
            'SALARY_PAID',
            'PAYMENT_RECEIVED',
            'WORKER_CREATED',
            'SYSTEM'
        ),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    data: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Additional data (product_id, worker_id, etc.)'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
        defaultValue: 'MEDIUM'
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['is_read']
        },
        {
            fields: ['type']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = Notification;
