"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// ============================================================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// ============================================================================
/**
 * @route POST /auth/register
 * @desc Registra um novo usuário
 * @access Public
 */
router.post('/register', authController_1.registerValidators, authController_1.register);
/**
 * @route POST /auth/login
 * @desc Autentica um usuário
 * @access Public
 */
router.post('/login', authController_1.loginValidators, authController_1.login);
/**
 * @route POST /auth/forgot-password
 * @desc Inicia processo de recuperação de senha
 * @access Public
 */
router.post('/forgot-password', authController_1.forgotPasswordValidators, authController_1.forgotPassword);
/**
 * @route POST /auth/reset-password
 * @desc Redefine senha usando token de recuperação
 * @access Public
 */
router.post('/reset-password', authController_1.resetPasswordValidators, authController_1.resetPassword);
/**
 * @route POST /auth/refresh-token
 * @desc Renova token de acesso usando refresh token
 * @access Public
 */
router.post('/refresh-token', authController_1.refreshTokenValidators, authController_1.refreshToken);
// ============================================================================
// ROTAS PROTEGIDAS (COM AUTENTICAÇÃO)
// ============================================================================
/**
 * @route GET /auth/profile
 * @desc Obtém perfil do usuário logado
 * @access Private
 */
router.get('/profile', authMiddleware_1.authenticateToken, authController_1.getProfile);
/**
 * @route PUT /auth/profile
 * @desc Atualiza perfil do usuário logado
 * @access Private
 */
router.put('/profile', authMiddleware_1.authenticateToken, authController_1.updateProfileValidators, authController_1.updateProfile);
/**
 * @route POST /auth/logout
 * @desc Realiza logout do usuário
 * @access Private
 */
router.post('/logout', authMiddleware_1.authenticateToken, authController_1.logout);
/**
 * @route GET /auth/verify-token
 * @desc Verifica se o token é válido
 * @access Private
 */
router.get('/verify-token', authMiddleware_1.authenticateToken, authController_1.verifyToken);
/**
 * @route PUT /auth/change-password
 * @desc Altera senha do usuário logado
 * @access Private
 */
router.put('/change-password', authMiddleware_1.authenticateToken, authController_1.changePasswordValidators, authController_1.changePassword);
// ============================================================================
// EXPORT DEFAULT
// ============================================================================
exports.default = router;
//# sourceMappingURL=authRoutes.js.map