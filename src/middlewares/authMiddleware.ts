// src/middlewares/authMiddleware.ts - VERSÃO ATUALIZADA

import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { AppError } from './AppError';
import { logger } from '../utils/logger';
import { PapelUsuario } from '@prisma/client';

// REVISÃO: A extensão global para o Request do Express está perfeita. Mantida como está.
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        papel: PapelUsuario;
      };
    }
  }
}

// REVISÃO: A validação crítica do JWT_SECRET no início do módulo é uma prática de segurança excelente. Mantida.
const JWT_SECRET_FROM_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_FROM_ENV) {
  const FATAL_ERROR_MSG = 'FATAL ERROR: JWT_SECRET não está definido nas variáveis de ambiente.';
  logger.error(FATAL_ERROR_MSG);
  // Em produção, encerrar o processo é a ação mais segura.
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    throw new Error(FATAL_ERROR_MSG);
  }
}
const JWT_SECRET: Secret = JWT_SECRET_FROM_ENV;

interface DecodedUserPayload extends JwtPayload {
  userId: number;
  email: string;
  papel: PapelUsuario;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Acesso negado: cabeçalho Authorization ausente ou malformado.', { path: req.path, ip: req.ip });
    return next(new AppError('Token de autenticação não fornecido.', 401));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUserPayload;

    // REVISÃO: Validação do payload um pouco mais concisa.
    const { userId, email, papel } = decoded;
    if (typeof userId !== 'number' || typeof email !== 'string' || !Object.values(PapelUsuario).includes(papel)) {
      logger.warn('Payload do token JWT inválido.', { payload: decoded, path: req.path, ip: req.ip });
      return next(new AppError('Token com conteúdo inválido.', 401));
    }

    req.user = { userId, email, papel };
    next();

  } catch (err) {
    // REVISÃO: Tratamento de erro mais específico e direto.
    if (err instanceof TokenExpiredError) {
      logger.warn('Token expirado.', { path: req.path, ip: req.ip });
      return next(new AppError('Sessão expirada. Por favor, faça login novamente.', 401));
    }
    if (err instanceof JsonWebTokenError) {
      logger.warn('Token inválido.', { path: req.path, ip: req.ip, error: err.message });
      return next(new AppError('Token de autenticação inválido.', 401));
    }
    
    logger.error('Erro inesperado na autenticação do token.', { path: req.path, error: (err as Error).message });
    return next(new AppError('Falha na autenticação.', 500));
  }
};