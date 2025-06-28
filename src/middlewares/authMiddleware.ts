import { Request, Response, NextFunction } from 'express';
import jwt, {
  Secret,
  JwtPayload,
  TokenExpiredError,
  JsonWebTokenError
} from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { PapelUsuario } from '@prisma/client';

interface DecodedUserPayload extends JwtPayload {
  userId: number;
  email: string;
  papel: PapelUsuario;
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedUserPayload;
    }
  }
}

const JWT_SECRET: Secret = (() => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    logger.error('FATAL: variável JWT_SECRET não está definida.');
    if (process.env.NODE_ENV === 'production') process.exit(1);
    throw new Error('FATAL: JWT_SECRET não está definida.');
  }
  return s;
})();

function verifyToken(token: string): Promise<DecodedUserPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) return reject(err);
      resolve(payload as DecodedUserPayload);
    });
  });
}

/**
 * Cria um middleware de autenticação e, opcionalmente, autorização por roles.
 * @param allowedRoles Array de PapelUsuario permitidos (se omitido, apenas autentica)
 */
export function createAuthMiddleware(allowedRoles?: PapelUsuario[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      logger.warn('Authorization header ausente ou malformado', { path: req.path });
      return next(new AppError('Token de autenticação não fornecido.', 401));
    }

    const token = header.slice(7);
    let decoded: DecodedUserPayload;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        logger.warn('Token expirado', { path: req.path });
        return next(new AppError('Sessão expirada. Faça login novamente.', 401));
      }
      if (err instanceof JsonWebTokenError) {
        logger.warn('Token inválido', { path: req.path, error: err.message });
        return next(new AppError('Token de autenticação inválido.', 401));
      }
      logger.error('Erro ao verificar token JWT', { error: (err as Error).message });
      return next(new AppError('Falha na autenticação.', 500));
    }

    const { userId, email, papel } = decoded;
    if (typeof userId !== 'number' || typeof email !== 'string') {
      logger.warn('Payload JWT com tipos incorretos', { payload: decoded });
      return next(new AppError('Token com conteúdo inválido.', 401));
    }
    if (!Object.values(PapelUsuario).includes(papel)) {
      logger.warn('Papel inválido no token', { papel });
      return next(new AppError('Token com papel inválido.', 401));
    }
    if (allowedRoles && !allowedRoles.includes(papel)) {
      logger.warn('Acesso negado por papel', { required: allowedRoles, got: papel });
      return next(new AppError('Você não tem permissão para acessar este recurso.', 403));
    }

    req.user = decoded;
    next();
  };
}

/** Middleware pronto para uso: apenas autentica */
export const authenticateToken = createAuthMiddleware();
