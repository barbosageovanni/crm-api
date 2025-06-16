// src/middlewares/validationMiddleware.ts - Versão Unificada e Corrigida

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { logger } from '../utils/logger';
import { AppError } from './AppError';

/**
 * Interface para erro formatado
 */
interface FormattedError {
  field: string;
  message: string;
  location?: string;
  value?: any;
}

/**
 * Middleware que verifica os resultados da validação do express-validator.
 * Se houver erros, ele formata e lança um AppError com status 400.
 * Se não houver erros, ele chama next() para prosseguir.
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }

  // Mapeia os erros para um formato mais limpo e consistente
  const formattedErrors: FormattedError[] = errors.array().map((error: ValidationError) => {
    const baseError: FormattedError = {
      field: 'field' in error ? error.path : 'general',
      message: error.msg,
    };

    // Adiciona informações extras se disponíveis
    if ('location' in error) {
      baseError.location = error.location;
    }

    if ('value' in error && error.value !== undefined) {
      baseError.value = error.value;
    }

    return baseError;
  });

  // Log do erro para debugging
  logger.warn('Erro de validação de entrada', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    errors: formattedErrors,
    body: process.env.NODE_ENV !== 'production' ? req.body : '[REDACTED]',
  });

  // Lança um AppError que será capturado pelo error handler global
  const error = new AppError('Dados de entrada inválidos.', 400);
  error.errors = formattedErrors;
  
  return next(error);
};

/**
 * Versão alternativa que retorna diretamente a resposta (para compatibilidade)
 * @deprecated Use handleValidationErrors em vez desta função
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((error: ValidationError) => ({
    field: 'field' in error ? error.path : 'general',
    message: error.msg,
    location: 'location' in error ? error.location : undefined,
  }));

  logger.warn('Erro de validação (método legado)', {
    path: req.path,
    method: req.method,
    errors: formattedErrors,
  });

  return res.status(400).json({
    status: 'error',
    message: 'Dados de entrada inválidos.',
    errors: formattedErrors,
  });
};

/**
 * Middleware simplificado para casos onde você só quer verificar se há erros
 * sem formatação especial
 */
export const checkValidationResult = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = new AppError('Dados de entrada inválidos.', 400);
    error.errors = errors.array();
    return next(error);
  }
  
  next();
};