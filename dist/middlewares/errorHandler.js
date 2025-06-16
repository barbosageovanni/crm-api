"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../errors/AppError");
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error('Erro capturado:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
    });
    if (error instanceof AppError_1.AppError) {
        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
        });
    }
    // Erros do Prisma
    if (error.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            status: 'error',
            message: 'Erro de banco de dados',
        });
    }
    // Erro genérico
    return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor',
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map