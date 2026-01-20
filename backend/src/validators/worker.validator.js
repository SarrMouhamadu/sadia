const { body, param, query } = require('express-validator');

const createWorkerValidator = [
    body('nom')
        .trim()
        .notEmpty().withMessage('Le nom est requis')
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('prenom')
        .trim()
        .notEmpty().withMessage('Le prénom est requis')
        .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('poste')
        .trim()
        .notEmpty().withMessage('Le poste est requis'),
    body('contact')
        .optional({ nullable: true, checkFalsy: true }),
        // .matches(/^(\+212|0)[5-7]\d{8}$/).withMessage('Numéro de téléphone invalide (format: +212XXXXXXXXX ou 0XXXXXXXXX)'),
    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    body('date_embauche')
        .notEmpty().withMessage('La date d\'embauche est requise')
        .isDate().withMessage('Date d\'embauche invalide')
        .custom((value) => {
            if (new Date(value) > new Date()) {
                throw new Error('La date d\'embauche ne peut pas être dans le futur');
            }
            return true;
        }),
    body('salaire_base')
        .notEmpty().withMessage('Le salaire de base est requis')
        .isFloat({ min: 0 }).withMessage('Le salaire doit être un nombre positif'),
    body('statut')
        .optional()
        .isIn(['ACTIF', 'INACTIF', 'SUSPENDU']).withMessage('Statut invalide'),
    body('site_affectation')
        .optional()
        .trim(),
    body('cin')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
];

const updateWorkerValidator = [
    param('id').isUUID().withMessage('ID invalide'),
    body('nom')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('prenom')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('contact')
        .optional({ nullable: true, checkFalsy: true }),
        // .matches(/^(\+212|0)[5-7]\d{8}$/).withMessage('Numéro de téléphone invalide'),
    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .isEmail().withMessage('Email invalide'),
    body('salaire_base')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le salaire doit être un nombre positif'),
    body('statut')
        .optional()
        .isIn(['ACTIF', 'INACTIF', 'SUSPENDU']).withMessage('Statut invalide')
];

const workerIdValidator = [
    param('id').isUUID().withMessage('ID invalide')
];

const listWorkersValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
    query('statut')
        .optional()
        .isIn(['ACTIF', 'INACTIF', 'SUSPENDU']).withMessage('Statut invalide'),
    query('site')
        .optional()
        .trim()
];

module.exports = {
    createWorkerValidator,
    updateWorkerValidator,
    workerIdValidator,
    listWorkersValidator
};
