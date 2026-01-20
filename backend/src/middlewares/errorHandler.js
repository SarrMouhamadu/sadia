const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Middleware de gestion des erreurs global
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error(`${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`);

    if (process.env.NODE_ENV === 'development') {
        logger.error(err.stack);
    }

    // Handle ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors })
        });
    }

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation',
            errors
        });
    }

    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: `Cette valeur existe déjà: ${e.value}`
        }));
        return res.status(409).json({
            success: false,
            message: 'Conflit de données',
            errors
        });
    }

    // Sequelize foreign key constraint error
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Référence invalide ou ressource liée existe'
        });
    }

    // Sequelize database error
    if (err.name === 'SequelizeDatabaseError') {
        return res.status(500).json({
            success: false,
            message: 'Erreur de base de données'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token invalide'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expiré'
        });
    }

    // Syntax error (malformed JSON)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'JSON invalide'
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Erreur interne du serveur'
            : err.message
    });
};

module.exports = errorHandler;
