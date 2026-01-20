const { body, param, query } = require('express-validator');

const createSalaryValidator = [
    body('worker_id')
        .notEmpty().withMessage('L\'ID du travailleur est requis')
        .isUUID().withMessage('ID du travailleur invalide'),
    body('mois')
        .notEmpty().withMessage('Le mois est requis')
        .isInt({ min: 1, max: 12 }).withMessage('Le mois doit être entre 1 et 12'),
    body('annee')
        .notEmpty().withMessage('L\'année est requise')
        .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide'),
    body('salaire_base')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le salaire de base doit être positif'),
    body('primes')
        .optional()
        .isFloat({ min: 0 }).withMessage('Les primes doivent être positives'),
    body('primes_details')
        .optional()
        .isArray().withMessage('Les détails des primes doivent être un tableau'),
    body('deductions')
        .optional()
        .isFloat({ min: 0 }).withMessage('Les déductions doivent être positives'),
    body('deductions_details')
        .optional()
        .isArray().withMessage('Les détails des déductions doivent être un tableau'),
    body('notes')
        .optional()
        .trim()
];

const updateSalaryValidator = [
    param('id').isUUID().withMessage('ID invalide'),
    body('primes')
        .optional()
        .isFloat({ min: 0 }).withMessage('Les primes doivent être positives'),
    body('deductions')
        .optional()
        .isFloat({ min: 0 }).withMessage('Les déductions doivent être positives'),
    body('notes')
        .optional()
        .trim()
];

const paySalaryValidator = [
    param('id').isUUID().withMessage('ID invalide'),
    body('mode_paiement')
        .optional()
        .isIn(['ESPECES', 'VIREMENT', 'CHEQUE']).withMessage('Mode de paiement invalide'),
    body('reference_paiement')
        .optional()
        .trim()
];

const salaryIdValidator = [
    param('id').isUUID().withMessage('ID invalide')
];

const listSalariesValidator = [
    query('month')
        .optional()
        .isInt({ min: 1, max: 12 }).withMessage('Mois invalide'),
    query('year')
        .optional()
        .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide'),
    query('statut')
        .optional()
        .isIn(['EN_ATTENTE', 'PAYE', 'ANNULE']).withMessage('Statut invalide'),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite invalide')
];

const generateMonthValidator = [
    body('mois')
        .notEmpty().withMessage('Le mois est requis')
        .isInt({ min: 1, max: 12 }).withMessage('Le mois doit être entre 1 et 12'),
    body('annee')
        .notEmpty().withMessage('L\'année est requise')
        .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide')
];

const generateBulletinValidator = [
    body('worker_id')
        .notEmpty().withMessage('L\'ID du travailleur est requis')
        .isUUID().withMessage('ID du travailleur invalide'),
    body('mois')
        .optional()
        .isInt({ min: 1, max: 12 }).withMessage('Le mois doit être entre 1 et 12'),
    body('annee')
        .optional()
        .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide')
];

const getBulletinValidator = [
    param('workerId').isUUID().withMessage('ID du travailleur invalide'),
    query('mois')
        .optional()
        .isInt({ min: 1, max: 12 }).withMessage('Le mois doit être entre 1 et 12'),
    query('annee')
        .optional()
        .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide')
];

const workerSalariesValidator = [
    param('workerId').isUUID().withMessage('ID du travailleur invalide')
];

module.exports = {
    createSalaryValidator,
    updateSalaryValidator,
    paySalaryValidator,
    salaryIdValidator,
    listSalariesValidator,
    generateMonthValidator,
    workerSalariesValidator,
    generateBulletinValidator,
    getBulletinValidator
};
