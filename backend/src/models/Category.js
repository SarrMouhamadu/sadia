const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Cette catégorie existe déjà'
        },
        validate: {
            notEmpty: { msg: 'Le nom de la catégorie est requis' },
            len: { args: [2, 100], msg: 'Le nom doit contenir entre 2 et 100 caractères' }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Category;
