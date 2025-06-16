// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log do erro
  logger.error('Erro capturado pelo errorHandler:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    userId: (req as any).user?.id
  });

  // Se for um erro customizado (AppError)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: {
        type: 'AppError',
        statusCode: error.statusCode
      }
    });
    return;
  }

  // Erros de validação do Prisma
  if (error.name === 'PrismaClientValidationError') {
    res.status(400).json({
      success: false,
      message: 'Dados inválidos fornecidos',
      error: {
        type: 'ValidationError',
        statusCode: 400
      }
    });
    return;
  }

  // Erros de conexão com o banco
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    // Violação de constraint unique
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Dados duplicados. Este registro já existe.',
        error: {
          type: 'UniqueConstraintError',
          statusCode: 409
        }
      });
      return;
    }
    
    // Registro não encontrado
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Registro não encontrado',
        error: {
          type: 'NotFoundError',
          statusCode: 404
        }
      });
      return;
    }
  }

  // Erros de JWT
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: {
        type: 'AuthenticationError',
        statusCode: 401
      }
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expirado',
      error: {
        type: 'AuthenticationError',
        statusCode: 401
      }
    });
    return;
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      message: 'JSON inválido no corpo da requisição',
      error: {
        type: 'SyntaxError',
        statusCode: 400
      }
    });
    return;
  }

  // Erro genérico (500 Internal Server Error)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : error.message,
    error: {
      type: 'InternalServerError',
      statusCode: 500,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error.stack,
        details: error.message
      })
    }
  });
};

// Classe de erro customizada
export { AppError } from '../middlewares/AppError';