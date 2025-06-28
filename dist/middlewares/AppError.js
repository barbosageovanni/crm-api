"use strict";
// src/middlewares/AppError.ts - Versão Melhorada e Completa
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ErrorCode = void 0;
exports.isAppError = isAppError;
exports.extractErrorInfo = extractErrorInfo;
/**
 * Enum para códigos de erro comuns
 */
var ErrorCode;
(function (ErrorCode) {
    // Autenticação e Autorização
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    // Validação
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    // Recursos
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["ALREADY_EXISTS"] = "ALREADY_EXISTS";
    ErrorCode["CONFLICT"] = "CONFLICT";
    // Servidor
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    // Rate Limiting
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Business Logic
    ErrorCode["BUSINESS_RULE_VIOLATION"] = "BUSINESS_RULE_VIOLATION";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Classe personalizada para erros da aplicação
 * Estende a classe Error nativa do JavaScript
 */
class AppError extends Error {
    statusCode;
    code;
    errors;
    isOperational;
    timestamp;
    context;
    constructor(message, statusCode = 500, code, errors, context) {
        super(message);
        // Mantém o nome da classe no stack trace
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.errors = errors;
        this.isOperational = true; // Indica que é um erro operacional, não um bug
        this.timestamp = new Date().toISOString();
        this.context = context;
        // Captura o stack trace (se disponível)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Converte o erro para formato JSON
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            code: this.code,
            errors: this.errors,
            timestamp: this.timestamp,
            context: this.context,
            stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined,
        };
    }
    /**
     * Verifica se é um erro de cliente (4xx)
     */
    isClientError() {
        return this.statusCode >= 400 && this.statusCode < 500;
    }
    /**
     * Verifica se é um erro de servidor (5xx)
     */
    isServerError() {
        return this.statusCode >= 500;
    }
    // ============================================================================
    // MÉTODOS ESTÁTICOS PARA CRIAÇÃO DE ERROS COMUNS
    // ============================================================================
    /**
     * Cria um erro de não autorizado (401)
     */
    static unauthorized(message = 'Não autorizado', code) {
        return new AppError(message, 401, code || ErrorCode.UNAUTHORIZED);
    }
    /**
     * Cria um erro de acesso proibido (403)
     */
    static forbidden(message = 'Acesso proibido', code) {
        return new AppError(message, 403, code || ErrorCode.FORBIDDEN);
    }
    /**
     * Cria um erro de recurso não encontrado (404)
     */
    static notFound(resource = 'Recurso', code) {
        return new AppError(`${resource} não encontrado`, 404, code || ErrorCode.NOT_FOUND);
    }
    /**
     * Cria um erro de conflito (409)
     */
    static conflict(message = 'Conflito de dados', code) {
        return new AppError(message, 409, code || ErrorCode.CONFLICT);
    }
    /**
     * Cria um erro de validação (400)
     */
    static validationError(message = 'Dados inválidos', errors) {
        return new AppError(message, 400, ErrorCode.VALIDATION_ERROR, errors);
    }
    /**
     * Cria um erro de entrada inválida (400)
     */
    static badRequest(message = 'Requisição inválida', code) {
        return new AppError(message, 400, code || ErrorCode.INVALID_INPUT);
    }
    /**
     * Cria um erro interno do servidor (500)
     */
    static internal(message = 'Erro interno do servidor', code, context) {
        return new AppError(message, 500, code || ErrorCode.INTERNAL_ERROR, undefined, context);
    }
    /**
     * Cria um erro de serviço indisponível (503)
     */
    static serviceUnavailable(message = 'Serviço temporariamente indisponível', code) {
        return new AppError(message, 503, code || ErrorCode.SERVICE_UNAVAILABLE);
    }
    /**
     * Cria um erro de rate limiting (429)
     */
    static rateLimitExceeded(message = 'Muitas requisições. Tente novamente mais tarde.', retryAfter) {
        const context = retryAfter ? { retryAfter } : undefined;
        return new AppError(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, undefined, context);
    }
    /**
     * Cria um erro de token expirado (401)
     */
    static tokenExpired(message = 'Token expirado') {
        return new AppError(message, 401, ErrorCode.TOKEN_EXPIRED);
    }
    /**
     * Cria um erro de token inválido (401)
     */
    static invalidToken(message = 'Token inválido') {
        return new AppError(message, 401, ErrorCode.INVALID_TOKEN);
    }
    /**
     * Cria um erro de credenciais inválidas (401)
     */
    static invalidCredentials(message = 'Credenciais inválidas') {
        return new AppError(message, 401, ErrorCode.INVALID_CREDENTIALS);
    }
    /**
     * Cria um erro de recurso já existente (409)
     */
    static alreadyExists(resource = 'Recurso', code) {
        return new AppError(`${resource} já existe`, 409, code || ErrorCode.ALREADY_EXISTS);
    }
    /**
     * Cria um erro de violação de regra de negócio (422)
     */
    static businessRuleViolation(message, code) {
        return new AppError(message, 422, code || ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    /**
     * Cria um erro de permissões insuficientes (403)
     */
    static insufficientPermissions(message = 'Permissões insuficientes') {
        return new AppError(message, 403, ErrorCode.INSUFFICIENT_PERMISSIONS);
    }
    /**
     * Cria um AppError a partir de um erro genérico
     */
    static fromError(error, statusCode = 500, code) {
        if (error instanceof AppError) {
            return error;
        }
        return new AppError(error.message || 'Erro desconhecido', statusCode, code, undefined, { originalError: error.name });
    }
}
exports.AppError = AppError;
/**
 * Type guard para verificar se um erro é uma instância de AppError
 */
function isAppError(error) {
    return error instanceof AppError;
}
/**
 * Extrai informações relevantes de um erro para logging
 */
function extractErrorInfo(error) {
    const info = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    };
    if (isAppError(error)) {
        info.statusCode = error.statusCode;
        info.code = error.code;
        info.errors = error.errors;
        info.timestamp = error.timestamp;
        info.context = error.context;
        info.isOperational = error.isOperational;
    }
    return info;
}
//# sourceMappingURL=AppError.js.map