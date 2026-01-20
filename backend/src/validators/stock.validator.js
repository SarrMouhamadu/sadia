const { body, param, query } = require('express-validator');

// Category validators
const createCategoryValidator = [
    body('nom')
        .trim()
        .notEmpty().withMessage('Le nom de la catégorie est requis')
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('description')
        .optional()
        .trim()
];

const updateCategoryValidator = [
    param('id').isUUID().withMessage('ID invalide'),
    body('nom')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('description')
        .optional()
        .trim()
];

const categoryIdValidator = [
    param('id').isUUID().withMessage('ID invalide')
];

// Product validators
const createProductValidator = [
    body('nom')
        .trim()
        .notEmpty().withMessage('Le nom du produit est requis')
        .isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),
    body('description')
        .optional()
        .trim(),
    body('category_id')
        .optional({ nullable: true })
        .isUUID().withMessage('ID de catégorie invalide'),
    body('code_produit')
        .optional()
        .trim(),
    body('unite')
        .optional()
        .trim(),
    body('quantite_actuelle')
        .optional()
        .isFloat({ min: 0 }).withMessage('La quantité doit être positive'),
    body('seuil_alerte')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le seuil d\'alerte doit être positif'),
    body('prix_unitaire')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le prix doit être positif')
];

const updateProductValidator = [
    param('id').isUUID().withMessage('ID invalide'),
    body('nom')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),
    body('category_id')
        .optional({ nullable: true })
        .isUUID().withMessage('ID de catégorie invalide'),
    body('quantite_actuelle')
        .optional()
        .isFloat({ min: 0 }).withMessage('La quantité doit être positive'),
    body('seuil_alerte')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le seuil d\'alerte doit être positif')
];

const productIdValidator = [
    param('id').isUUID().withMessage('ID invalide')
];

const listProductsValidator = [
    query('category')
        .optional()
        .isUUID().withMessage('ID de catégorie invalide'),
    query('statut')
        .optional()
        .isIn(['OK', 'ALERTE', 'RUPTURE']).withMessage('Statut invalide'),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite invalide')
];

// Stock movement validators
const stockEntryValidator = [
    body('product_id')
        .notEmpty().withMessage('L\'ID du produit est requis')
        .isUUID().withMessage('ID du produit invalide'),
    body('quantite')
        .notEmpty().withMessage('La quantité est requise')
        .isFloat({ min: 0.01 }).withMessage('La quantité doit être supérieure à 0'),
    body('source')
        .optional()
        .trim(),
    body('reference')
        .optional()
        .trim(),
    body('notes')
        .optional()
        .trim()
];

const stockExitValidator = [
    body('product_id')
        .notEmpty().withMessage('L\'ID du produit est requis')
        .isUUID().withMessage('ID du produit invalide'),
    body('quantite')
        .notEmpty().withMessage('La quantité est requise')
        .isFloat({ min: 0.01 }).withMessage('La quantité doit être supérieure à 0'),
    body('destination')
        .notEmpty().withMessage('La destination est obligatoire pour une sortie')
        .trim(),
    body('reference')
        .optional()
        .trim(),
    body('notes')
        .optional()
        .trim()
];

const listMovementsValidator = [
    query('product')
        .optional()
        .isUUID().withMessage('ID du produit invalide'),
    query('type')
        .optional()
        .isIn(['ENTREE', 'SORTIE']).withMessage('Type invalide'),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite invalide')
];

module.exports = {
    createCategoryValidator,
    updateCategoryValidator,
    categoryIdValidator,
    createProductValidator,
    updateProductValidator,
    productIdValidator,
    listProductsValidator,
    stockEntryValidator,
    stockExitValidator,
    listMovementsValidator
};
