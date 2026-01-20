const { User } = require('../models');
const {
    authMiddleware,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require('../middlewares/auth');
const { asyncHandler, ApiResponse, ApiError, logger } = require('../utils');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Admin only (or public for first admin)
 */
const register = asyncHandler(async (req, res) => {
    const { nom, prenom, email, password, role, adminSecretKey } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw ApiError.conflict('Un utilisateur avec cet email existe déjà');
    }

    let userRole = 'ASSISTANT';

    // Logic for Role Assignment
    if (role === 'ADMIN') {
        // To register as ADMIN, one must provide the correct Secret Key
        if (adminSecretKey === process.env.ADMIN_SECRET_KEY) {
            userRole = 'ADMIN';
        } else {
            throw ApiError.forbidden('Clé secrète invalide pour la création d\'un compte administrateur');
        }
    } else {
        // RESTRICTION: Only an existing ADMIN can create an ASSISTANT (or other roles)
        // Check if the requester is authenticated and is an ADMIN
        if (!req.user || req.user.role !== 'ADMIN') {
            throw ApiError.forbidden('Seul un administrateur connecté peut créer un compte assistant');
        }
        userRole = 'ASSISTANT';
    }

    const user = await User.create({
        nom,
        prenom,
        email,
        password,
        role: userRole
    });

    logger.info(`New user registered: ${email} (${userRole})`);

    ApiResponse.created(res, {
        user: user.toJSON()
    }, 'Utilisateur créé avec succès');
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    // Check if user is active
    if (!user.is_active) {
        throw ApiError.unauthorized('Compte désactivé. Contactez l\'administrateur');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to database
    user.refresh_token = refreshToken;
    user.last_login = new Date();
    await user.save();

    logger.info(`User logged in: ${email}`);

    ApiResponse.success(res, {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '24h'
    }, 'Connexion réussie');
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public (with refresh token)
 */
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        throw ApiError.badRequest('Refresh token requis');
    }

    // Verify refresh token
    let decoded;
    try {
        decoded = verifyRefreshToken(token);
    } catch (error) {
        throw ApiError.unauthorized('Refresh token invalide ou expiré');
    }

    // Find user and verify token matches
    const user = await User.findByPk(decoded.id);
    if (!user || user.refresh_token !== token) {
        throw ApiError.unauthorized('Refresh token invalide');
    }

    if (!user.is_active) {
        throw ApiError.unauthorized('Compte désactivé');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token in database
    user.refresh_token = newRefreshToken;
    await user.save();

    ApiResponse.success(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRE || '24h'
    }, 'Token rafraîchi avec succès');
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (user) {
        user.refresh_token = null;
        await user.save();
        logger.info(`User logged out: ${user.email}`);
    }

    ApiResponse.success(res, null, 'Déconnexion réussie');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
        throw ApiError.notFound('Utilisateur non trouvé');
    }

    ApiResponse.success(res, { user: user.toJSON() });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
    const { nom, prenom, email } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
        throw ApiError.notFound('Utilisateur non trouvé');
    }

    // Check email uniqueness if changed
    if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw ApiError.conflict('Cet email est déjà utilisé');
        }
    }

    // Update fields
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email;

    await user.save();

    ApiResponse.success(res, { user: user.toJSON() }, 'Profil mis à jour avec succès');
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
        throw ApiError.notFound('Utilisateur non trouvé');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw ApiError.badRequest('Mot de passe actuel incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    ApiResponse.success(res, null, 'Mot de passe modifié avec succès');
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Admin
 */
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.findAll({
        attributes: { exclude: ['password', 'refresh_token'] },
        order: [['created_at', 'DESC']]
    });

    ApiResponse.success(res, { users });
});

/**
 * @desc    Update user status (Admin only)
 * @route   PATCH /api/auth/users/:id/status
 * @access  Admin
 */
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (id === req.user.id) {
        throw ApiError.badRequest('Vous ne pouvez pas modifier votre propre statut');
    }

    const user = await User.findByPk(id);

    if (!user) {
        throw ApiError.notFound('Utilisateur non trouvé');
    }

    user.is_active = is_active;
    await user.save();

    logger.info(`User status updated: ${user.email} - Active: ${is_active}`);

    ApiResponse.success(res, { user: user.toJSON() }, 'Statut mis à jour avec succès');
});

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    updateMe,
    changePassword,
    getUsers,
    updateUserStatus
};
