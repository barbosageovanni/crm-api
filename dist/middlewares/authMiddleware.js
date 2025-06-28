"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
exports.createAuthMiddleware = createAuthMiddleware;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const AppError_1 = require("../errors/AppError");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const JWT_SECRET = (() => {
    const s = process.env.JWT_SECRET;
    if (!s) {
        logger_1.logger.error('FATAL: variável JWT_SECRET não está definida.');
        if (process.env.NODE_ENV === 'production')
            process.exit(1);
        throw new Error('FATAL: JWT_SECRET não está definida.');
    }
    return s;
})();
function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, payload) => {
            if (err)
                return reject(err);
            resolve(payload);
        });
    });
}
/**
 * Cria um middleware de autenticação e, opcionalmente, autorização por roles.
 * @param allowedRoles Array de PapelUsuario permitidos (se omitido, apenas autentica)
 */
function createAuthMiddleware(allowedRoles) {
    return async (req, res, next) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            logger_1.logger.warn('Authorization header ausente ou malformado', { path: req.path });
            return next(new AppError_1.AppError('Token de autenticação não fornecido.', 401));
        }
        const token = header.slice(7);
        let decoded;
        try {
            decoded = await verifyToken(token);
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.TokenExpiredError) {
                logger_1.logger.warn('Token expirado', { path: req.path });
                return next(new AppError_1.AppError('Sessão expirada. Faça login novamente.', 401));
            }
            if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
                logger_1.logger.warn('Token inválido', { path: req.path, error: err.message });
                return next(new AppError_1.AppError('Token de autenticação inválido.', 401));
            }
            logger_1.logger.error('Erro ao verificar token JWT', { error: err.message });
            return next(new AppError_1.AppError('Falha na autenticação.', 500));
        }
        const { userId, email, papel } = decoded;
        if (typeof userId !== 'number' || typeof email !== 'string') {
            logger_1.logger.warn('Payload JWT com tipos incorretos', { payload: decoded });
            return next(new AppError_1.AppError('Token com conteúdo inválido.', 401));
        }
        if (!Object.values(client_1.PapelUsuario).includes(papel)) {
            logger_1.logger.warn('Papel inválido no token', { papel });
            return next(new AppError_1.AppError('Token com papel inválido.', 401));
        }
        if (allowedRoles && !allowedRoles.includes(papel)) {
            logger_1.logger.warn('Acesso negado por papel', { required: allowedRoles, got: papel });
            return next(new AppError_1.AppError('Você não tem permissão para acessar este recurso.', 403));
        }
        req.user = decoded;
        next();
    };
}
/** Middleware pronto para uso: apenas autentica */
exports.authenticateToken = createAuthMiddleware();
//# sourceMappingURL=authMiddleware.js.map