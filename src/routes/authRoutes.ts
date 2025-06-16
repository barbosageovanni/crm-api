// src/routes/authRoutes.ts - Estrutura Corrigida e Consistente

import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  logout,
  verifyToken,
  refreshToken,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  // Validadores
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  changePasswordValidators,
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ============================================================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================================================

/**
 * @route   POST /auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post(
  '/register',
  rateLimiter('auth', { windowMs: 15 * 60 * 1000, max: 5 }), // 5 tentativas por 15 min
  registerValidators,
  register
);

/**
 * @route   POST /auth/login
 * @desc    Fazer login
 * @access  Public
 */
router.post(
  '/login',
  rateLimiter('auth', { windowMs: 15 * 60 * 1000, max: 10 }), // 10 tentativas por 15 min
  loginValidators,
  login
);

/**
 * @route   POST /auth/forgot-password
 * @desc    Solicitar recuperação de senha
 * @access  Public
 */
router.post(
  '/forgot-password',
  rateLimiter('auth', { windowMs: 60 * 60 * 1000, max: 3 }), // 3 tentativas por hora
  forgotPasswordValidators,
  forgotPassword
);

/**
 * @route   POST /auth/reset-password
 * @desc    Redefinir senha com token
 * @access  Public
 */
router.post(
  '/reset-password',
  rateLimiter('auth', { windowMs: 15 * 60 * 1000, max: 5 }), // 5 tentativas por 15 min
  resetPasswordValidators,
  resetPassword
);

/**
 * @route   POST /auth/refresh-token
 * @desc    Renovar token de acesso
 * @access  Public (mas requer refresh token válido)
 */
router.post(
  '/refresh-token',
  rateLimiter('auth', { windowMs: 5 * 60 * 1000, max: 10 }), // 10 tentativas por 5 min
  refreshToken
);

// ============================================================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================================================

/**
 * @route   GET /auth/profile
 * @desc    Obter perfil do usuário logado
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /auth/profile
 * @desc    Atualizar perfil do usuário
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  rateLimiter('profile', { windowMs: 15 * 60 * 1000, max: 20 }), // 20 atualizações por 15 min
  updateProfile
);

/**
 * @route   POST /auth/change-password
 * @desc    Alterar senha (usuário logado)
 * @access  Private
 */
router.post(
  '/change-password',
  authenticateToken,
  rateLimiter('auth', { windowMs: 15 * 60 * 1000, max: 5 }), // 5 tentativas por 15 min
  changePasswordValidators,
  changePassword
);

/**
 * @route   POST /auth/logout
 * @desc    Fazer logout
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   GET /auth/verify-token
 * @desc    Verificar validade do token
 * @access  Private
 */
router.get('/verify-token', authenticateToken, verifyToken);

// ============================================================================
// EXPORTAÇÃO
// ============================================================================

export default router;