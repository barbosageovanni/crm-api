import { Request, Response, NextFunction } from 'express';
import { body, matchedData } from 'express-validator';
import { authService } from '../services/authService';
import { RegisterUserDTO, LoginUserDTO } from '../dtos/authDtos';
import { AppError } from '../errors/AppError';
import { handleValidationErrors } from '../middlewares/validationMiddleware';
import { logger } from '../utils/logger';
import { $Enums } from '@prisma/client';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    papel: $Enums.PapelUsuario;
  };
}

interface UpdateProfileDTO {
  nome?: string;
  email?: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const createPasswordValidator = (fieldName: string, isRequired = true) => {
  const validator = body(fieldName);
  
  if (isRequired) {
    validator
      .notEmpty()
      .withMessage(`${fieldName} é obrigatório.`);
  }
  
  return validator
    .isLength({ min: 8, max: 128 })
    .withMessage(`${fieldName} deve ter entre 8 e 128 caracteres.`)
    .matches(PASSWORD_REGEX)
    .withMessage(`${fieldName} deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.`);
};

const createEmailValidator = (fieldName = 'email', isRequired = true) => {
  const validator = body(fieldName).trim();
  
  if (isRequired) {
    validator
      .notEmpty()
      .withMessage('Email é obrigatório.');
  }
  
  return validator
    .isEmail()
    .withMessage('Email inválido.')
    .isLength({ max: 255 })
    .withMessage('Email muito longo.')
    .normalizeEmail();
};

// ============================================================================
// VALIDATORS
// ============================================================================

export const registerValidators = [
  body('nome')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres.')
    .matches(NAME_REGEX)
    .withMessage('Nome deve conter apenas letras, espaços, hífens e apostrofos.')
    .escape(),
    
  createEmailValidator(),
  createPasswordValidator('senha'),
    
  body('papel')
    .notEmpty()
    .withMessage('Papel é obrigatório.')
    .isIn(Object.values($Enums.PapelUsuario))
    .withMessage(`Papel deve ser um dos seguintes: ${Object.values($Enums.PapelUsuario).join(', ')}.`),
    
  handleValidationErrors,
];

export const loginValidators = [
  createEmailValidator(),
    
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória.')
    .isLength({ min: 1, max: 128 })
    .withMessage('Senha inválida.'),
    
  handleValidationErrors,
];

export const forgotPasswordValidators = [
  createEmailValidator(),
  handleValidationErrors,
];

export const resetPasswordValidators = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório.')
    .isLength({ min: 10, max: 500 })
    .withMessage('Token inválido.')
    .isJWT()
    .withMessage('Token deve ter formato válido.'),
    
  createPasswordValidator('novaSenha'),
  handleValidationErrors,
];

export const changePasswordValidators = [
  body('senhaAtual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória.')
    .isLength({ min: 1, max: 128 })
    .withMessage('Senha atual inválida.'),
    
  createPasswordValidator('novaSenha'),
  
  body('novaSenha').custom((value, { req }) => {
    if (value === req.body.senhaAtual) {
      throw new Error('A nova senha deve ser diferente da senha atual.');
    }
    return true;
  }),
    
  handleValidationErrors,
];

export const updateProfileValidators = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres.')
    .matches(NAME_REGEX)
    .withMessage('Nome deve conter apenas letras, espaços, hífens e apostrofos.')
    .escape(),
    
  createEmailValidator('email', false),
    
  handleValidationErrors,
];

export const refreshTokenValidators = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token é obrigatório.')
    .isJWT()
    .withMessage('Refresh token deve ter formato válido.'),
    
  handleValidationErrors,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getClientInfo = (req: Request) => ({
  ip: req.ip || req.connection.remoteAddress || 'unknown',
  userAgent: req.get('User-Agent') || 'unknown',
  timestamp: new Date().toISOString(),
});

const sanitizeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido';
};

const extractUserId = (req: AuthenticatedRequest): number => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Token inválido ou ausente.', 401);
  }
  return userId;
};

// ============================================================================
// CONTROLLERS
// ============================================================================

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const registerData = matchedData(req) as RegisterUserDTO;
    const clientInfo = getClientInfo(req);
    
    logger.info('Tentativa de registro de usuário', {
      email: registerData.email,
      papel: registerData.papel,
      ...clientInfo,
    });

    const userProfile = await authService.register(registerData);
    
    logger.info('Usuário registrado com sucesso', {
      userId: userProfile.id,
      email: userProfile.email,
      papel: userProfile.papel,
      ...clientInfo,
    });

    res.status(201).json({
      user: userProfile,
      message: 'Usuário registrado com sucesso!',
    });
  } catch (error) {
    logger.error('Erro no registro de usuário', {
      error: sanitizeError(error),
      email: req.body?.email,
      ...getClientInfo(req),
    });
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loginData = matchedData(req) as LoginUserDTO;
    const clientInfo = getClientInfo(req);
    
    logger.info('Tentativa de login', {
      email: loginData.email,
      ...clientInfo,
    });

    const authResponse = await authService.login(loginData);
    
    logger.info('Login realizado com sucesso', {
      userId: authResponse.user.id,
      email: authResponse.user.email,
      ...clientInfo,
    });

    res.status(200).json({
      ...authResponse,
      message: 'Login realizado com sucesso!',
    });
  } catch (error) {
    logger.warn('Falha no login', {
      error: sanitizeError(error),
      email: req.body?.email,
      ...getClientInfo(req),
    });
    next(error);
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = extractUserId(req);
    
    const userProfile = await authService.getUserProfile(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userProfile,
      },
    });
  } catch (error) {
    logger.error('Erro ao obter perfil do usuário', {
      error: sanitizeError(error),
      userId: req.user?.userId,
      ...getClientInfo(req),
    });
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const clientInfo = getClientInfo(req);
    
    // Por enquanto, apenas fazemos o logout do lado cliente
    // TODO: Implementar blacklist de tokens no authService
    
    logger.info('Logout realizado', {
      userId,
      ...clientInfo,
    });

    res.status(200).json({
      status: 'success',
      message: 'Logout realizado com sucesso.',
    });
  } catch (error) {
    logger.error('Erro no logout', {
      error: sanitizeError(error),
      userId: req.user?.userId,
      ...getClientInfo(req),
    });
    next(error);
  }
};

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = extractUserId(req);
    
    // Se chegou até aqui, o token é válido (passou pelo middleware de autenticação)
    res.status(200).json({
      status: 'success',
      message: 'Token válido.',
      data: {
        userId,
        valid: true,
      },
    });
  } catch (error) {
    logger.warn('Token inválido ou expirado', {
      error: sanitizeError(error),
      userId: req.user?.userId,
      ...getClientInfo(req),
    });
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = matchedData(req);
    const clientInfo = getClientInfo(req);
    
    // TODO: Implementar refresh token no authService
    logger.warn('Refresh token não implementado', {
      token: token.substring(0, 10) + '...',
      ...clientInfo,
    });
    
    throw new AppError('Funcionalidade de refresh token não implementada ainda.', 501);
  } catch (error) {
    logger.warn('Falha na renovação do token', {
      error: sanitizeError(error),
      ...getClientInfo(req),
    });
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = extractUserId(req);
    const updateData = matchedData(req) as UpdateProfileDTO;
    
    if (Object.keys(updateData).length === 0) {
      throw new AppError('Nenhum campo para atualizar foi fornecido.', 400);
    }
    
    // TODO: Implementar updateProfile no authService
    logger.warn('Update profile não implementado', {
      userId,
      changedFields: Object.keys(updateData),
      ...getClientInfo(req),
    });

    throw new AppError('Funcionalidade de atualização de perfil não implementada ainda.', 501);
  } catch (error) {
    logger.error('Erro ao atualizar perfil', {
      error: sanitizeError(error),
      userId: req.user?.userId,
      ...getClientInfo(req),
    });
    next(error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = extractUserId(req);
    const { senhaAtual, novaSenha } = matchedData(req);
    
    // TODO: Implementar changePassword no authService
    logger.warn('Change password não implementado', { 
      userId,
      ...getClientInfo(req),
    });

    throw new AppError('Funcionalidade de alteração de senha não implementada ainda.', 501);
  } catch (error) {
    logger.warn('Falha na alteração de senha', {
      error: sanitizeError(error),
      userId: req.user?.userId,
      ...getClientInfo(req),
    });
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const clientInfo = getClientInfo(req);
  const standardResponse = {
    status: 'success',
    message: 'Se o email estiver registrado, você receberá instruções para redefinir sua senha.',
  };

  try {
    const { email } = matchedData(req);
    
    logger.info('Solicitação de recuperação de senha', {
      email,
      ...clientInfo,
    });

    // TODO: Implementar forgotPassword no authService
    logger.warn('Forgot password não implementado', { email });

    // Por segurança, sempre retorna sucesso, mesmo sem implementar
    res.status(200).json(standardResponse);
  } catch (error) {
    logger.error('Erro na recuperação de senha', {
      error: sanitizeError(error),
      email: req.body?.email,
      ...clientInfo,
    });
    
    res.status(200).json(standardResponse);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, novaSenha } = matchedData(req);
    const clientInfo = getClientInfo(req);
    
    logger.info('Tentativa de reset de senha', {
      tokenPrefix: token.substring(0, 10) + '...',
      ...clientInfo,
    });

    // TODO: Implementar resetPassword no authService
    logger.warn('Reset password não implementado');

    throw new AppError('Funcionalidade de reset de senha não implementada ainda.', 501);
  } catch (error) {
    logger.warn('Falha no reset de senha', {
      error: sanitizeError(error),
      ...getClientInfo(req),
    });
    next(error);
  }
};