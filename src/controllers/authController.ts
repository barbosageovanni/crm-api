import { Request, Response, NextFunction } from 'express';
import { validationResult, matchedData } from 'express-validator'; // Para usar com as validações de rota
import { authService } from '../services/authService'; // Importa a instância do AuthService
import { RegisterUserDTO, LoginUserDTO } from '../dtos/authDtos';
import { AppError, ValidationError as CustomValidationError } from '../errors/AppError'; // Usaremos para os erros de validação
import { logger } from '../utils/logger';

/**
 * Lida com o registro de um novo usuário.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  // Validação de entrada (será definida nas rotas com express-validator)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Se houver erros de validação do express-validator, cria um ValidationError
    logger.warn('Falha na validação ao registrar usuário', { errors: errors.array() });
    return next(new CustomValidationError(errors.array(), 'Dados de registro inválidos.'));
  }

  // Extrai os dados validados do corpo da requisição
  // matchedData() retorna apenas os campos que passaram na validação
  const registerData = matchedData(req) as RegisterUserDTO;

  try {
    const userProfile = await authService.register(registerData);
    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      user: userProfile,
    });
  } catch (error) {
    // Encaminha o erro para o middleware de tratamento de erros global
    next(error);
  }
};

/**
 * Lida com o login de um usuário existente.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  // Validação de entrada (será definida nas rotas com express-validator)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Falha na validação ao tentar fazer login', { errors: errors.array() });
    return next(new CustomValidationError(errors.array(), 'Dados de login inválidos.'));
  }

  const loginData = matchedData(req) as LoginUserDTO;

  try {
    const authResponse = await authService.login(loginData);
    res.status(200).json({
      message: 'Login bem-sucedido!',
      ...authResponse, // Inclui user e token
    });
  } catch (error) {
    next(error);
  }
};

// Futuramente, você pode adicionar outros métodos aqui, como:
// - forgotPassword
// - resetPassword
// - refreshToken
// - logout (embora o logout com JWT seja geralmente tratado no frontend invalidando o token)