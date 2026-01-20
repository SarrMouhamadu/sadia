const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('Token d\'accès requis');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw ApiError.unauthorized('Token d\'accès requis');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Verify user still exists and is active
        const user = await User.findByPk(decoded.id);

        if (!user) {
            throw ApiError.unauthorized('Utilisateur non trouvé');
        }

        if (!user.is_active) {
            throw ApiError.unauthorized('Compte désactivé');
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            nom: user.nom,
            prenom: user.prenom
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(ApiError.unauthorized('Token expiré'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(ApiError.unauthorized('Token invalide'));
        }
        next(error);
    }
};

/**
 * Middleware optionnel d'authentification
 * Ne bloque pas si pas de token, mais attache l'utilisateur si présent
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findByPk(decoded.id);

        if (user && user.is_active) {
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                nom: user.nom,
                prenom: user.prenom
            };
        }

        next();
    } catch (error) {
        // Ignore token errors for optional auth
        next();
    }
};

/**
 * Génère un access token JWT
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
};

/**
 * Génère un refresh token JWT
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
};

/**
 * Vérifie un refresh token
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
};

module.exports = {
    authMiddleware,
    optionalAuth,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};
