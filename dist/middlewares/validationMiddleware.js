"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const AppError_1 = require("../errors/AppError");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined,
        }));
        throw new AppError_1.AppError('Dados de entrada inválidos.', 400, formattedErrors);
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
//# sourceMappingURL=validationMiddleware.js.map