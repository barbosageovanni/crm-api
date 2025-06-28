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
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  changePasswordValidators,
  updateProfileValidators,
  refreshTokenValidators
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// ============================================================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// ============================================================================

/**
 * @route GET /auth
 * @desc Informações sobre as rotas de autenticação disponíveis
 * @access Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API de Autenticação CRM Transpontual',
    version: '1.0.0',
    availableRoutes: {
      public: [
        'POST /auth/register - Registrar novo usuário',
        'POST /auth/login - Fazer login',
        'POST /auth/forgot-password - Solicitar recuperação de senha',
        'POST /auth/reset-password - Redefinir senha',
        'POST /auth/refresh-token - Renovar token'
      ],
      protected: [
        'GET /auth/profile - Obter perfil do usuário',
        'PUT /auth/profile - Atualizar perfil',
        'POST /auth/logout - Fazer logout',
        'GET /auth/verify-token - Verificar token',
        'PUT /auth/change-password - Alterar senha'
      ]
    },
    documentation: 'Consulte a documentação da API para mais detalhes sobre cada endpoint.'
  });
});

/**
 * @route POST /auth/register
 * @desc Registra um novo usuário
 * @access Public
 */
router.post('/register', registerValidators, register);

/**
 * @route POST /auth/login
 * @desc Autentica um usuário
 * @access Public
 */
router.post('/login', loginValidators, login);

/**
 * @route GET /auth/login
 * @desc Retorna erro específico para requisições GET na rota de login
 * @access Public
 */
router.get('/login', (req, res) => {
  res.status(405).json({
    status: 'error',
    message: 'Método não permitido. Use POST para fazer login.',
    allowedMethods: ['POST'],
    hint: 'Esta rota aceita apenas requisições POST com email e senha no corpo da requisição.'
  });
});

/**
 * @route POST /auth/forgot-password
 * @desc Inicia processo de recuperação de senha
 * @access Public
 */
router.post('/forgot-password', forgotPasswordValidators, forgotPassword);

/**
 * @route POST /auth/reset-password
 * @desc Redefine senha usando token de recuperação
 * @access Public
 */
router.post('/reset-password', resetPasswordValidators, resetPassword);

/**
 * @route POST /auth/refresh-token
 * @desc Renova token de acesso usando refresh token
 * @access Public
 */
router.post('/refresh-token', refreshTokenValidators, refreshToken);

// ============================================================================
// ROTAS PROTEGIDAS (COM AUTENTICAÇÃO)
// ============================================================================

/**
 * @route GET /auth/profile
 * @desc Obtém perfil do usuário logado
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route PUT /auth/profile
 * @desc Atualiza perfil do usuário logado
 * @access Private
 */
router.put('/profile', authenticateToken, updateProfileValidators, updateProfile);

/**
 * @route POST /auth/logout
 * @desc Realiza logout do usuário
 * @access Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route GET /auth/verify-token
 * @desc Verifica se o token é válido
 * @access Private
 */
router.get('/verify-token', authenticateToken, verifyToken);

/**
 * @route PUT /auth/change-password
 * @desc Altera senha do usuário logado
 * @access Private
 */
router.put('/change-password', authenticateToken, changePasswordValidators, changePassword);

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default router;