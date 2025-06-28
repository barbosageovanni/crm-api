import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/AppError';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Rota não encontrada: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) return next(err);

  logger.error('Erro capturado pelo errorHandler', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
    user: (req as any).user
  });

  // AppError (nossos erros customizados)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errors: err.errors
    });
    return;
  }

  // Erros do Prisma
  if ((err as any).code && (err as any) instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaErr = err as Prisma.PrismaClientKnownRequestError;
    // Único constraint
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ status: 'error', message: 'Registro duplicado.' });
      return;
    }
    // Not found
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ status: 'error', message: 'Registro não encontrado.' });
      return;
    }
  }
  // JSON malformado
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ status: 'error', message: 'JSON inválido no corpo da requisição.' });
    return;
  }

  // Falha genérica
  const code = process.env.NODE_ENV === 'production' ? 500 : 500;
  const msg  = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor.'
    : err.message;

  res.status(code).json({
    status: 'error',
    message: msg,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
