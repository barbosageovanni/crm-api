// src/controllers/authController.ts - Versão Corrigida e Completa

import { Request, Response, NextFunction } from 'express';
import { body, matchedData } from 'express-validator';
import { authService } from '../services/authService';
import { RegisterUserDTO, LoginUserDTO } from '../dtos/authDtos';
import { AppError } from '../middlewares/AppError';
import { handleValidationErrors } from '../middlewares/validationMiddleware';
import { logger } from '../utils/logger';
import { $Enums } from '@prisma/client';

// ============================================================================
// VALIDADORES DE ENTRADA
// ============================================================================

export const registerValidators = [
  body('nome')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres.')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços.')
    .escape(),
    
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email é obrigatório.')
    .isEmail()
    .withMessage('Email inválido.')
    .isLength({ max: 255 })
    .withMessage('Email muito longo.')
    .normalizeEmail(),
    
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória.')
    .isLength({ min: 8, max: 128 })
    .withMessage('Senha deve ter entre 8 e 128 caracteres.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.'),
    
  body('papel')
    .notEmpty()
    .withMessage('Papel é obrigatório.')
    .isIn(Object.values($Enums.PapelUsuario))
    .withMessage(`Papel deve ser um dos seguintes: ${Object.values($Enums.PapelUsuario).join(', ')}.`),
    
  handleValidationErrors,
];

export const loginValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email é obrigatório.')
    .isEmail()
    .withMessage('Email inválido.')
    .normalizeEmail(),
    
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória.')
    .isLength({ min: 1, max: 128 })
    .withMessage('Senha inválida.'),
    
  handleValidationErrors,
];

export const forgotPasswordValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email é obrigatório.')
    .isEmail()
    .withMessage('Email inválido.')
    .normalizeEmail(),
    
  handleValidationErrors,
];

export const resetPasswordValidators = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório.')
    .isLength({ min: 10, max: 500 })
    .withMessage('Token inválido.'),
    
  body('novaSenha')
    .notEmpty()
    .withMessage('Nova senha é obrigatória.')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nova senha deve ter entre 8 e 128 caracteres.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nova senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.'),
    
  handleValidationErrors,
];

export const changePasswordValidators = [
  body('senhaAtual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória.'),
    
  body('novaSenha')
    .notEmpty()
    .withMessage('Nova senha é obrigatória.')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nova senha deve ter entre 8 e 128 caracteres.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nova senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.'),
    
  handleValidationErrors,
];

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Controller para registro de usuário
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const registerData = matchedData(req) as RegisterUserDTO;
    
    logger.info('Tentativa de registro de usuário', {
      email: registerData.email,
      papel: registerData.papel,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const userProfile = await authService.register(registerData);
    
    logger.info('Usuário registrado com sucesso', {
      userId: userProfile.id,
      email: userProfile.email,
      papel: userProfile.papel,
    });

    res.status(201).json({
      status: 'success',
      message: 'Usuário registrado com sucesso!',
      data: {
        user: userProfile,
      },
    });
  } catch (error) {
    logger.error('Erro no registro de usuário', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      email: req.body?.email,
    });
    next(error);
  }
};

/**
 * Controller para login de usuário
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loginData = matchedData(req) as LoginUserDTO;
    
    logger.info('Tentativa de login', {
      email: loginData.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const authResponse = await authService.login(loginData);
    
    logger.info('Login realizado com sucesso', {
      userId: authResponse.user.id,
      email: authResponse.user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Login realizado com sucesso!',
      data: authResponse,
    });
  } catch (error) {
    logger.warn('Falha no login', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      email: req.body?.email,
      ip: req.ip,
    });
    next(error);
  }
};

/**
 * Controller para obter perfil do usuário logado
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return next(new AppError('Token inválido ou ausente.', 401));
    }

    const userProfile = await authService.getUserProfile(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userProfile,
      },
    });
  } catch (error) {
    logger.error('Erro ao obter perfil do usuário', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      userId: req.user?.userId,
    });
    next(error);
  }
};

/**
 * Controller para logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (userId) {
      // Aqui você pode implementar invalidação de token no Redis ou DB
      await authService.logout(userId);
      
      logger.info('Logout realizado', {
        userId,
        ip: req.ip,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logout realizado com sucesso.',
    });
  } catch (error) {
    logger.error('Erro no logout', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      userId: req.user?.userId,
    });
    next(error);
  }
};

/**
 * Controller para verificar validade do token
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return next(new AppError('Token inválido.', 401));
    }

    const isValid = await authService.verifyTokenValidity(userId);
    
    if (!isValid) {
      return next(new AppError('Token expirado ou inválido.', 401));
    }

    res.status(200).json({
      status: 'success',
      message: 'Token válido.',
      data: {
        userId,
        valid: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return next(new AppError('Refresh token é obrigatório.', 400));
    }

    const authResponse = await authService.refreshToken(token);
    
    res.status(200).json({
      status: 'success',
      message: 'Token renovado com sucesso.',
      data: authResponse,
    });
  } catch (error) {
    logger.warn('Falha na renovação do token', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      ip: req.ip,
    });
    next(error);
  }
};

/**
 * Controller para atualizar perfil
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return next(new AppError('Usuário não autenticado.', 401));
    }

    const updateData = matchedData(req);
    const updatedProfile = await authService.updateProfile(userId, updateData);
    
    logger.info('Perfil atualizado', {
      userId,
      changedFields: Object.keys(updateData),
    });

    res.status(200).json({
      status: 'success',
      message: 'Perfil atualizado com sucesso.',
      data: {
        user: updatedProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para mudança de senha
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return next(new AppError('Usuário não autenticado.', 401));
    }

    const { senhaAtual, novaSenha } = matchedData(req);
    
    await authService.changePassword(userId, senhaAtual, novaSenha);
    
    logger.info('Senha alterada com sucesso', { userId });

    res.status(200).json({
      status: 'success',
      message: 'Senha alterada com sucesso.',
    });
  } catch (error) {
    logger.warn('Falha na alteração de senha', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      userId: req.user?.userId,
    });
    next(error);
  }
};

/**
 * Controller para esqueci minha senha
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = matchedData(req);
    
    logger.info('Solicitação de recuperação de senha', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    await authService.forgotPassword(email);

    // Sempre retorna sucesso para não revelar se o email existe
    res.status(200).json({
      status: 'success',
      message: 'Se o email estiver registrado, você receberá instruções para redefinir sua senha.',
    });
  } catch (error) {
    logger.error('Erro na recuperação de senha', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      email: req.body?.email,
    });
    
    // Mesmo em caso de erro, não revela detalhes por segurança
    res.status(200).json({
      status: 'success',
      message: 'Se o email estiver registrado, você receberá instruções para redefinir sua senha.',
    });
  }
};

/**
 * Controller para resetar senha
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, novaSenha } = matchedData(req);
    
    logger.info('Tentativa de reset de senha', {
      token: token.substring(0, 10) + '...',
      ip: req.ip,
    });

    await authService.resetPassword(token, novaSenha);
    
    logger.info('Senha resetada com sucesso');

    res.status(200).json({
      status: 'success',
      message: 'Senha redefinida com sucesso.',
    });
  } catch (error) {
    logger.warn('Falha no reset de senha', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      ip: req.ip,
    });
    next(error);
  }
};