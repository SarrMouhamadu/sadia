const { body, param, query } = require('express-validator');

const registerValidator = [
    body('nom')
        .trim()
        .notEmpty().withMessage('Le nom est requis')
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('prenom')
        .trim()
        .notEmpty().withMessage('Le prénom est requis')
        .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
        .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
        .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
    body('role')
        .optional()
        .isIn(['ADMIN', 'ASSISTANT']).withMessage('Rôle invalide')
];

const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Email invalide'),
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
];

const refreshTokenValidator = [
    body('refreshToken')
        .notEmpty().withMessage('Le refresh token est requis')
];

const changePasswordValidator = [
    body('currentPassword')
        .notEmpty().withMessage('Le mot de passe actuel est requis'),
    body('newPassword')
        .notEmpty().withMessage('Le nouveau mot de passe est requis')
        .isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
        .matches(/\d/).withMessage('Le nouveau mot de passe doit contenir au moins un chiffre')
];

module.exports = {
    registerValidator,
    loginValidator,
    refreshTokenValidator,
    changePasswordValidator
};
