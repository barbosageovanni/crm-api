"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const AppError_1 = require("../middlewares/AppError");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const notFoundHandler = (req, res, next) => {
    next(new AppError_1.AppError(`Rota não encontrada: ${req.method} ${req.originalUrl}`, 404));
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, req, res, next) => {
    if (res.headersSent)
        return next(err);
    logger_1.logger.error('Erro capturado pelo errorHandler', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        params: req.params,
        query: req.query,
        body: req.body,
        user: req.user
    });
    // AppError (nossos erros customizados)
    if (err instanceof AppError_1.AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            errors: err.errors
        });
        return;
    }
    // Erros do Prisma
    if (err.code && err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const prismaErr = err;
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
    const msg = process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor.'
        : err.message;
    res.status(code).json({
        status: 'error',
        message: msg,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map