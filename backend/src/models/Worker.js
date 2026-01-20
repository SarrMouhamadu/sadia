const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Worker = sequelize.define('Worker', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le nom est requis' },
            len: { args: [2, 100], msg: 'Le nom doit contenir entre 2 et 100 caractères' }
        }
    },
    prenom: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le prénom est requis' },
            len: { args: [2, 100], msg: 'Le prénom doit contenir entre 2 et 100 caractères' }
        }
    },
    poste: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le poste est requis' }
        }
    },
    contact: {
        type: DataTypes.STRING(20),
        allowNull: true,
        // validate: {
        //     is: {
        //         args: /^(\+212|0)[5-7]\d{8}$/,
        //         msg: 'Numéro de téléphone invalide (format: +212XXXXXXXXX ou 0XXXXXXXXX)'
        //     }
        // }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        validate: {
            isEmail: { msg: 'Email invalide' }
        }
    },
    date_embauche: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: 'Date d\'embauche invalide' },
            isBeforeToday(value) {
                if (new Date(value) > new Date()) {
                    throw new Error('La date d\'embauche ne peut pas être dans le futur');
                }
            }
        }
    },
    salaire_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: 'Le salaire doit être un nombre décimal' },
            min: { args: [0], msg: 'Le salaire doit être positif' }
        }
    },
    statut: {
        type: DataTypes.ENUM('ACTIF', 'INACTIF', 'SUSPENDU'),
        defaultValue: 'ACTIF',
        allowNull: false
    },
    site_affectation: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    cin: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
    },
    adresse: {
        type: DataTypes.TEXT,
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
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'workers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
});

module.exports = Worker;
