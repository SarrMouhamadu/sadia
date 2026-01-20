const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
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
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            msg: 'Cet email est déjà utilisé'
        },
        validate: {
            isEmail: { msg: 'Email invalide' },
            notEmpty: { msg: 'L\'email est requis' }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le mot de passe est requis' },
            len: { args: [6, 255], msg: 'Le mot de passe doit contenir au moins 6 caractères' }
        }
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'ASSISTANT'),
        defaultValue: 'ASSISTANT',
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (without sensitive data)
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    delete values.refresh_token;
    return values;
};

module.exports = User;
