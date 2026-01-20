const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Salary = sequelize.define('Salary', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    worker_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'workers',
            key: 'id'
        }
    },
    mois: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Le mois doit être entre 1 et 12' },
            max: { args: [12], msg: 'Le mois doit être entre 1 et 12' }
        }
    },
    annee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [2000], msg: 'L\'année doit être supérieure à 2000' },
            max: { args: [2100], msg: 'L\'année doit être inférieure à 2100' }
        }
    },
    salaire_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Le salaire de base doit être positif' }
        }
    },
    primes: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Les primes doivent être positives' }
        }
    },
    primes_details: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of {label, amount}'
    },
    deductions: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Les déductions doivent être positives' }
        }
    },
    deductions_details: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of {label, amount}'
    },
    salaire_net: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    statut: {
        type: DataTypes.ENUM('EN_ATTENTE', 'PAYE', 'ANNULE'),
        defaultValue: 'EN_ATTENTE',
        allowNull: false
    },
    date_paiement: {
        type: DataTypes.DATE,
        allowNull: true
    },
    mode_paiement: {
        type: DataTypes.ENUM('ESPECES', 'VIREMENT', 'CHEQUE'),
        allowNull: true
    },
    reference_paiement: {
        type: DataTypes.STRING(100),
        allowNull: true
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
    tableName: 'salaries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['worker_id', 'mois', 'annee'],
            name: 'unique_salary_per_month'
        }
    ],
    hooks: {
        beforeValidate: (salary) => {
            // Calculate net salary
            const base = parseFloat(salary.salaire_base) || 0;
            const primes = parseFloat(salary.primes) || 0;
            const deductions = parseFloat(salary.deductions) || 0;
            salary.salaire_net = base + primes - deductions;
        },
        beforeUpdate: (salary) => {
            // Recalculate net salary on update
            if (salary.changed('salaire_base') || salary.changed('primes') || salary.changed('deductions')) {
                const base = parseFloat(salary.salaire_base) || 0;
                const primes = parseFloat(salary.primes) || 0;
                const deductions = parseFloat(salary.deductions) || 0;
                salary.salaire_net = base + primes - deductions;
            }
        }
    }
});

module.exports = Salary;
