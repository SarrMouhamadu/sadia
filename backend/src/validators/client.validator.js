const { body, param, query } = require('express-validator');

// Client validators
const createClientValidator = [
    body('nom')
        .trim()
        .notEmpty().withMessage('Le nom du client est requis')
        .isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),
    body('site')
        .optional()
        .trim(),
    body('telephone')
        .optional({ nullable: true, checkFalsy: true }),
        // .matches(/^(\+212|0)[5-7]\d{8}$/).withMessage('Numéro de téléphone invalide'),
    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    body('adresse')
        .optional()
        .trim(),
    body('contact_principal')
        .optional()
        .trim(),
    body('type_contrat')
        .optional()
        .trim(),
    body('prix_contrat')
        .notEmpty().withMessage('Le prix du contrat est requis')
        .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
    body('date_debut')
        .optional()
        .isDate().withMessage('Date de début invalide'),
    body('date_fin')
        .optional()
        .isDate().withMessage('Date de fin invalide'),
    body('notes')
        .optional()
        .trim()
];

const updateClientValidator = [
    param('id').isUUID().withMessage('ID invalide'),
    body('nom')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),
    body('telephone')
        .optional({ nullable: true, checkFalsy: true }),
        // .matches(/^(\+212|0)[5-7]\d{8}$/).withMessage('Numéro de téléphone invalide'),
    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .isEmail().withMessage('Email invalide'),
    body('prix_contrat')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
    body('statut')
        .optional()
        .isIn(['EN_COURS', 'TERMINE', 'SUSPENDU']).withMessage('Statut invalide')
];

const clientIdValidator = [
    param('id').isUUID().withMessage('ID invalide')
];

const listClientsValidator = [
    query('statut')
        .optional()
        .isIn(['EN_COURS', 'TERMINE', 'SUSPENDU']).withMessage('Statut invalide'),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite invalide')
];

// Payment validators
const createPaymentValidator = [
    param('id').isUUID().withMessage('ID du client invalide'),
    body('montant')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ min: 0.01 }).withMessage('Le montant doit être supérieur à 0'),
    body('date_paiement')
        .optional()
        .isDate().withMessage('Date de paiement invalide'),
    body('mois')
        .optional()
        .isInt({ min: 1, max: 12 }).withMessage('Le mois doit être entre 1 et 12'),
    body('annee')
        .optional()
        .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide'),
    body('mode_paiement')
        .optional()
        .isIn(['ESPECES', 'VIREMENT', 'CHEQUE', 'CARTE']).withMessage('Mode de paiement invalide'),
    body('reference')
        .optional()
        .trim(),
    body('notes')
        .optional()
        .trim()
];

const updatePaymentValidator = [
    param('id').isUUID().withMessage('ID invalide'),
    body('montant')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Le montant doit être supérieur à 0'),
    body('mode_paiement')
        .optional()
        .isIn(['ESPECES', 'VIREMENT', 'CHEQUE', 'CARTE']).withMessage('Mode de paiement invalide')
];

const paymentIdValidator = [
    param('id').isUUID().withMessage('ID invalide')
];

const receiptQueryValidator = [
    param('id').isUUID().withMessage('ID du client invalide'),
    query('month')
        .optional()
        .isInt({ min: 1, max: 12 }).withMessage('Mois invalide'),
    query('year')
        .optional()
        .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide')
];

module.exports = {
    createClientValidator,
    updateClientValidator,
    clientIdValidator,
    listClientsValidator,
    createPaymentValidator,
    updatePaymentValidator,
    paymentIdValidator,
    receiptQueryValidator
};
