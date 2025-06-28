import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../errors/AppError';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));
    
    throw new AppError('Dados de entrada inválidos.', 400, formattedErrors);
  }
  
  next();
};