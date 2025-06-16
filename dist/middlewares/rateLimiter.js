"use strict";
// src/middlewares/rateLimiter.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeBasedLimiter = exports.criticalLimiter = exports.createLimiter = exports.apiLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit")); // Importe Options e Store para tipagem
const logger_1 = require("../utils/logger");
// ... (seção do redisStore comentada permanece como está, pois ainda não está ativa) ...
const createRateLimiter = (windowMs, max, messageText, useRedisIfAvailable) => {
    // Inicialize seu store customizado aqui. Por enquanto, será undefined.
    let customStore = undefined;
    // DESCOMENTE E ADAPTE QUANDO FOR IMPLEMENTAR O REDIS STORE
    /*
    if (useRedisIfAvailable && typeof redisStore !== 'undefined') { // 'redisStore' viria da sua lógica comentada
      customStore = redisStore; // Atribui o redisStore se ele estiver configurado e disponível
    }
    */
    // Crie o objeto de opções base
    const options = {
        windowMs,
        max,
        message: {
            error: 'Too many requests',
            message: messageText, // Use o parâmetro messageText aqui
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, _next, opts) => {
            logger_1.logger.warn('Rate limit atingido', {
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
                message: typeof opts.message === 'string' ? opts.message : opts.message.message,
                retryAfter: Math.ceil(opts.windowMs / 1000)
            });
        },
        skip: (req) => {
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
    return (0, express_rate_limit_1.default)(options);
};
// ... (resto do seu arquivo: generalLimiter, authLimiter, etc.) ...
// Certifique-se que o parâmetro 'message' em createRateLimiter seja usado corretamente.
// No seu código original, o parâmetro 'message' da função createRateLimiter era usado
// na propriedade message.message do objeto de mensagem. Renomeei para messageText para clareza.
exports.generalLimiter = createRateLimiter(parseInt(process.env.GENERAL_LIMIT_WINDOW_MS || String(15 * 60 * 1000)), parseInt(process.env.GENERAL_LIMIT_MAX || '100'), 'Muitas requisições. Tente novamente mais tarde.' // Este é o messageText
);
// ... Defina os outros limiters da mesma forma ...
exports.authLimiter = createRateLimiter(parseInt(process.env.AUTH_LIMIT_WINDOW_MS || String(15 * 60 * 1000)), parseInt(process.env.AUTH_LIMIT_MAX || '5'), 'Muitas tentativas de login. Tente novamente mais tarde.');
exports.apiLimiter = createRateLimiter(parseInt(process.env.API_LIMIT_WINDOW_MS || String(1 * 60 * 1000)), parseInt(process.env.API_LIMIT_MAX || '20'), 'Limite de API atingido. Tente novamente em 1 minuto.');
exports.createLimiter = createRateLimiter(parseInt(process.env.CREATE_LIMIT_WINDOW_MS || String(1 * 60 * 1000)), parseInt(process.env.CREATE_LIMIT_MAX || '5'), 'Limite de criação atingido. Tente novamente em 1 minuto.');
exports.criticalLimiter = createRateLimiter(parseInt(process.env.CRITICAL_LIMIT_WINDOW_MS || String(5 * 60 * 1000)), parseInt(process.env.CRITICAL_LIMIT_MAX || '3'), 'Operação crítica limitada. Tente novamente em 5 minutos.');
const routeBasedLimiter = (req, res, next) => {
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
        return (0, exports.authLimiter)(req, res, next);
    }
    if (req.method === 'POST' && (req.path === '/clientes' || req.path === '/clientes/')) {
        return (0, exports.createLimiter)(req, res, next);
    }
    if (req.method === 'DELETE' && req.path.startsWith('/clientes/')) {
        return (0, exports.criticalLimiter)(req, res, next);
    }
    if (req.path.startsWith('/api/') || req.path.startsWith('/clientes')) {
        return (0, exports.apiLimiter)(req, res, next);
    }
    return (0, exports.generalLimiter)(req, res, next);
};
exports.routeBasedLimiter = routeBasedLimiter;
//# sourceMappingURL=rateLimiter.js.map