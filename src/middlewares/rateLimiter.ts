// src/middlewares/rateLimiter.ts

import rateLimit, { Options, Store } from 'express-rate-limit'; // Importe Options e Store para tipagem
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ... (seção do redisStore comentada permanece como está, pois ainda não está ativa) ...

const createRateLimiter = (windowMs: number, max: number, messageText: string, useRedisIfAvailable?: boolean) => {
  // Inicialize seu store customizado aqui. Por enquanto, será undefined.
  let customStore: Store | undefined = undefined;

  // DESCOMENTE E ADAPTE QUANDO FOR IMPLEMENTAR O REDIS STORE
  /*
  if (useRedisIfAvailable && typeof redisStore !== 'undefined') { // 'redisStore' viria da sua lógica comentada
    customStore = redisStore; // Atribui o redisStore se ele estiver configurado e disponível
  }
  */

  // Crie o objeto de opções base
  const options: Partial<Options> = { // Use Partial<Options> para flexibilidade
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message: messageText, // Use o parâmetro messageText aqui
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response, _next: NextFunction, opts: Options) => {
      logger.warn('Rate limit atingido', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        limit: opts.max,
        windowMs: opts.windowMs,
      });
      
      res.status(opts.statusCode).json({
        error: 'Too many requests',
        // Acessar message de opts.message, que pode ser um objeto ou string
        message: typeof opts.message === 'string' ? opts.message : (opts.message as { message: string }).message,
        retryAfter: Math.ceil(opts.windowMs / 1000)
      });
    },
    skip: (req: Request) => {
      const whitelist = (process.env.RATE_LIMIT_WHITELIST || '').split(',').filter(ip => ip.trim() !== '');
      return process.env.NODE_ENV === 'development' && req.ip ? whitelist.includes(req.ip) : false;
    }
  };

  // Adicione a propriedade 'store' ao objeto 'options' SOMENTE se 'customStore' tiver um valor válido.
  // Se 'customStore' for undefined, a propriedade 'store' será omitida,
  // e 'express-rate-limit' usará o MemoryStore padrão.
  if (customStore) {
    options.store = customStore;
  }

  return rateLimit(options);
};

// ... (resto do seu arquivo: generalLimiter, authLimiter, etc.) ...
// Certifique-se que o parâmetro 'message' em createRateLimiter seja usado corretamente.
// No seu código original, o parâmetro 'message' da função createRateLimiter era usado
// na propriedade message.message do objeto de mensagem. Renomeei para messageText para clareza.

export const generalLimiter = createRateLimiter(
  parseInt(process.env.GENERAL_LIMIT_WINDOW_MS || String(15 * 60 * 1000)),
  parseInt(process.env.GENERAL_LIMIT_MAX || '100'),
  'Muitas requisições. Tente novamente mais tarde.' // Este é o messageText
);

// ... Defina os outros limiters da mesma forma ...

export const authLimiter = createRateLimiter(
  parseInt(process.env.AUTH_LIMIT_WINDOW_MS || String(15 * 60 * 1000)),
  parseInt(process.env.AUTH_LIMIT_MAX || '5'),
  'Muitas tentativas de login. Tente novamente mais tarde.'
);

export const apiLimiter = createRateLimiter(
  parseInt(process.env.API_LIMIT_WINDOW_MS || String(1 * 60 * 1000)),
  parseInt(process.env.API_LIMIT_MAX || '20'),
  'Limite de API atingido. Tente novamente em 1 minuto.'
);

export const createLimiter = createRateLimiter(
  parseInt(process.env.CREATE_LIMIT_WINDOW_MS || String(1 * 60 * 1000)),
  parseInt(process.env.CREATE_LIMIT_MAX || '5'),
  'Limite de criação atingido. Tente novamente em 1 minuto.'
);

export const criticalLimiter = createRateLimiter(
  parseInt(process.env.CRITICAL_LIMIT_WINDOW_MS || String(5 * 60 * 1000)),
  parseInt(process.env.CRITICAL_LIMIT_MAX || '3'),
  'Operação crítica limitada. Tente novamente em 5 minutos.'
);


export const routeBasedLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    return authLimiter(req, res, next);
  }
  
  if (req.method === 'POST' && (req.path === '/clientes' || req.path === '/clientes/')) {
    return createLimiter(req, res, next);
  }
  
  if (req.method === 'DELETE' && req.path.startsWith('/clientes/')) {
    return criticalLimiter(req, res, next);
  }
  
  if (req.path.startsWith('/api/') || req.path.startsWith('/clientes')) {
      return apiLimiter(req, res, next);
  }

  return generalLimiter(req, res, next);
};