const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'clients',
            key: 'id'
        }
    },
    montant: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: { args: [0.01], msg: 'Le montant doit être supérieur à 0' }
        }
    },
    date_paiement: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    mois: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: { args: [1], msg: 'Le mois doit être entre 1 et 12' },
            max: { args: [12], msg: 'Le mois doit être entre 1 et 12' }
        }
    },
    annee: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: { args: [2000], msg: 'L\'année doit être supérieure à 2000' }
        }
    },
    mode_paiement: {
        type: DataTypes.ENUM('ESPECES', 'VIREMENT', 'CHEQUE', 'CARTE'),
        defaultValue: 'ESPECES',
        allowNull: false
    },
    reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Numéro de chèque, référence de virement, etc.'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['client_id']
        },
        {
            fields: ['date_paiement']
        }
    ]
});

module.exports = Payment;
