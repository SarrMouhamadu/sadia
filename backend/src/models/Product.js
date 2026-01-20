const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nom: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le nom du produit est requis' },
            len: { args: [2, 200], msg: 'Le nom doit contenir entre 2 et 200 caractères' }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id'
        }
    },
    code_produit: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    unite: {
        type: DataTypes.STRING(50),
        defaultValue: 'pièce',
        allowNull: false
    },
    quantite_actuelle: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'La quantité ne peut pas être négative' }
        }
    },
    seuil_alerte: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 10,
        validate: {
            min: { args: [0], msg: 'Le seuil d\'alerte doit être positif' }
        }
    },
    prix_unitaire: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: { args: [0], msg: 'Le prix doit être positif' }
        }
    },
    statut: {
        type: DataTypes.ENUM('OK', 'ALERTE', 'RUPTURE'),
        defaultValue: 'OK',
        allowNull: false
    },
    derniere_maj: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    emplacement: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    fournisseur: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    hooks: {
        beforeSave: (product) => {
            // Update status based on quantity
            const qty = parseFloat(product.quantite_actuelle) || 0;
            const threshold = parseFloat(product.seuil_alerte) || 0;

            if (qty <= 0) {
                product.statut = 'RUPTURE';
            } else if (qty <= threshold) {
                product.statut = 'ALERTE';
            } else {
                product.statut = 'OK';
            }

            product.derniere_maj = new Date();
        }
    }
});

module.exports = Product;
