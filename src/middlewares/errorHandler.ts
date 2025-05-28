// middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Erro capturado:', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method 
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  }

  // Erros do Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      status: 'error',
      message: 'Erro de banco de dados',
    });
  }

  // Erro genérico
  return res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
  });
};