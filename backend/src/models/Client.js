const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nom: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le nom du client est requis' },
            len: { args: [2, 200], msg: 'Le nom doit contenir entre 2 et 200 caractères' }
        }
    },
    site: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    telephone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        // validate: {
        //     is: {
        //         args: /^(\+212|0)[5-7]\d{8}$/,
        //         msg: 'Numéro de téléphone invalide'
        //     }
        // }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: { msg: 'Email invalide' }
        }
    },
    adresse: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contact_principal: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Nom de la personne de contact'
    },
    type_contrat: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Type de contrat (mensuel, annuel, ponctuel)'
    },
    prix_contrat: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Le prix du contrat doit être positif' }
        }
    },
    montant_paye: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Le montant payé doit être positif' }
        }
    },
    montant_du: {
        type: DataTypes.VIRTUAL,
        get() {
            const prix = parseFloat(this.prix_contrat) || 0;
            const paye = parseFloat(this.montant_paye) || 0;
            return prix - paye;
        }
    },
    statut: {
        type: DataTypes.ENUM('EN_COURS', 'TERMINE', 'SUSPENDU'),
        defaultValue: 'EN_COURS',
        allowNull: false
    },
    date_debut: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    date_fin: {
        type: DataTypes.DATEONLY,
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
    tableName: 'clients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
});

module.exports = Client;
