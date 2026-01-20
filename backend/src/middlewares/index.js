const { authMiddleware, optionalAuth, generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('./auth');
const { roleCheck, adminOnly, staffOnly } = require('./roleCheck');
const errorHandler = require('./errorHandler');
const validate = require('./validate');

module.exports = {
    authMiddleware,
    optionalAuth,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    roleCheck,
    adminOnly,
    staffOnly,
    errorHandler,
    validate
};
