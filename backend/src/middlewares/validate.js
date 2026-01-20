const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware pour vérifier les résultats de validation express-validator
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));

        throw ApiError.badRequest('Erreur de validation', formattedErrors);
    }

    next();
};

module.exports = validate;
