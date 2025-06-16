import rateLimit, { Options, Store } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Função auxiliar para criar limiters com configurações padrão e customizadas
const createRateLimiter = (options: Partial<Options>): any => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutos
    max: options.max || 100, // Limite de 100 requisições por IP por windowMs
    message: 'Muitas requisições de seu IP, por favor, tente novamente após 15 minutos.',
    standardHeaders: true, // Retorna informações de limite nas headers `RateLimit-*`
    legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
    handler: (req: Request, res: Response, next: NextFunction, options: Options) => {
      logger.warn(`Rate limit excedido para IP: ${req.ip} na rota ${req.method} ${req.originalUrl}`);
      res.status(options.statusCode || 429).send(options.message);
    },
    ...options,
  });
};

// Definindo os limiters específicos
export const generalLimiter = createRateLimiter({
  max: 100, // 100 requisições por 15 minutos para rotas gerais
  windowMs: 15 * 60 * 1000,
});

export const apiLimiter = createRateLimiter({
  max: 60, // 60 requisições por 15 minutos para rotas /api
  windowMs: 15 * 60 * 1000,
});

export const authLimiter = createRateLimiter({
  max: 5, // 5 requisições por 5 minutos para rotas de autenticação (login/registro)
  windowMs: 5 * 60 * 1000,
  message: 'Muitas tentativas de autenticação. Por favor, tente novamente após 5 minutos.',
});

export const createLimiter = createRateLimiter({
  max: 10, // 10 requisições de criação por 15 minutos
  windowMs: 15 * 60 * 1000,
  message: 'Muitas requisições de criação. Por favor, tente novamente mais tarde.',
});

export const criticalLimiter = createRateLimiter({
  max: 3, // 3 requisições críticas (ex: delete) por 15 minutos
  windowMs: 15 * 60 * 1000,
  message: 'Muitas requisições críticas. Por favor, tente novamente mais tarde.',
});

export const routeBasedLimiter = (req: Request, res: Response, next: NextFunction) => {
  // REVISÃO: A lógica foi reordenada para ser mais clara e eficiente (do mais específico para o mais geral).

  // 1. Rotas de autenticação são as mais críticas para limitar
  if (req.path.startsWith('/auth')) { // Removido /api pois as rotas já são /auth/login, etc.
    return authLimiter(req, res, next);
  }
  
  // 2. Limitar operações de criação (POST) em rotas de recursos principais
  if (req.method === 'POST' && req.path.startsWith('/clientes')) {
    return createLimiter(req, res, next);
  }
  
  // 3. Limitar operações perigosas como DELETE
  if (req.method === 'DELETE' && req.path.startsWith('/clientes/')) {
    return criticalLimiter(req, res, next);
  }
  
  // 4. Um limite geral para todas as outras chamadas de API
  if (req.path.startsWith('/api/')) {
      return apiLimiter(req, res, next);
  }

  // 5. Um limite genérico para qualquer outra rota que não seja da API
  return generalLimiter(req, res, next);
};

