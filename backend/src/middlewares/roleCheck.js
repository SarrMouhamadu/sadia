const ApiError = require('../utils/ApiError');

/**
 * Middleware de vérification des rôles
 * Vérifie si l'utilisateur a les permissions nécessaires
 * @param {string[]} allowedRoles - Liste des rôles autorisés
 */
const roleCheck = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Authentification requise');
            }

            // If no roles specified, allow any authenticated user
            if (allowedRoles.length === 0) {
                return next();
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw ApiError.forbidden('Accès refusé. Permissions insuffisantes');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Shortcut for admin-only routes
 */
const adminOnly = roleCheck(['ADMIN']);

/**
 * Shortcut for admin and assistant routes
 */
const staffOnly = roleCheck(['ADMIN', 'ASSISTANT']);

module.exports = {
    roleCheck,
    adminOnly,
    staffOnly
};
