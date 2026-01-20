const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('ENTREE', 'SORTIE'),
        allowNull: false
    },
    quantite: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0.01], msg: 'La quantité doit être supérieure à 0' }
        }
    },
    quantite_avant: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Quantity before movement'
    },
    quantite_apres: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Quantity after movement'
    },
    destination: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            destinationRequired(value) {
                if (this.type === 'SORTIE' && !value) {
                    throw new Error('La destination est obligatoire pour une sortie');
                }
            }
        }
    },
    source: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Source for entries (supplier, etc.)'
    },
    reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Reference number (invoice, order, etc.)'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'stock_movements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['product_id']
        },
        {
            fields: ['type']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = StockMovement;
