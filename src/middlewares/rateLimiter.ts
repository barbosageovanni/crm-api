// src/middlewares/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Rate limiter personalizado com log
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit atingido', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method
      });
      
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req: Request) => {
      // Skip para IPs da whitelist em desenvolvimento
      const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
      return process.env.NODE_ENV === 'development' && whitelist.includes(req.ip);
    }
  });
};

// Rate limiters específicos
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  100, // 100 requests por IP
  'Muitas requisições. Tente novamente em 15 minutos.'
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  5, // 5 tentativas de login por IP
  'Muitas tentativas de login. Tente novamente em 15 minutos.'
);

export const apiLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minuto
  20, // 20 requests por minuto
  'Limite de API atingido. Tente novamente em 1 minuto.'
);

export const createLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minuto
  5, // 5 criações por minuto
  'Limite de criação atingido. Tente novamente em 1 minuto.'
);

// Rate limiter mais restritivo para operações críticas
export const criticalLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutos
  3, // 3 requests por 5 minutos
  'Operação crítica limitada. Tente novamente em 5 minutos.'
);

// Middleware para aplicar rate limiting baseado em rota
export const routeBasedLimiter = (req: Request, res: Response, next: any) => {
  // Rate limiting específico por rota
  if (req.path.includes('/auth/login')) {
    return authLimiter(req, res, next);
  }
  
  if (req.method === 'POST' && req.path.includes('/clientes')) {
    return createLimiter(req, res, next);
  }
  
  if (req.method === 'DELETE') {
    return criticalLimiter(req, res, next);
  }
  
  // Rate limiting padrão para outras rotas
  return apiLimiter(req, res, next);
};