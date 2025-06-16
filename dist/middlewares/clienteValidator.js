"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = exports.validateGetCliente = exports.validateUpdateCliente = exports.validateCreateCliente = void 0;
const express_validator_1 = require("express-validator");
const cpf_cnpj_validator_1 = require("cpf-cnpj-validator");
/**
 * Validação para criação de Cliente
 */
exports.validateCreateCliente = [
    (0, express_validator_1.body)('nome')
        .trim()
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ max: 100 }).withMessage('Nome pode ter até 100 caracteres')
        .escape(),
    // CNPJ/CPF agora opcional, mas se fornecido deve ser válido
    (0, express_validator_1.body)('cnpjCpf')
        .optional()
        .trim()
        .custom(value => {
        // Se valor está presente, validar
        if (value && !(cpf_cnpj_validator_1.cpf.isValid(value) || cpf_cnpj_validator_1.cnpj.isValid(value))) {
            throw new Error('CNPJ/CPF inválido');
        }
        return true;
    })
        .escape(),
    (0, express_validator_1.body)('tipo')
        .trim()
        .notEmpty().withMessage('Tipo é obrigatório')
        .isIn(['PJ', 'PF']).withMessage('Tipo deve ser "PJ" ou "PF"')
        .escape(),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
];
/**
 * Validação para atualização de Cliente
 */
exports.validateUpdateCliente = [
    (0, express_validator_1.param)('id')
        .isInt({ gt: 0 }).withMessage('ID deve ser um número inteiro positivo'),
    (0, express_validator_1.body)('nome')
        .optional()
        .trim()
        .notEmpty().withMessage('Nome não pode ser vazio')
        .isLength({ max: 100 }).withMessage('Nome pode ter até 100 caracteres')
        .escape(),
    (0, express_validator_1.body)('cnpjCpf')
        .optional()
        .trim()
        .custom(value => {
        // Se valor está presente, validar
        if (value && !(cpf_cnpj_validator_1.cpf.isValid(value) || cpf_cnpj_validator_1.cnpj.isValid(value))) {
            throw new Error('CNPJ/CPF inválido');
        }
        return true;
    })
        .escape(),
    (0, express_validator_1.body)('tipo')
        .optional()
        .trim()
        .isIn(['PJ', 'PF']).withMessage('Tipo deve ser "PJ" ou "PF"')
        .escape(),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    (0, express_validator_1.body)('ativo')
        .optional()
        .isBoolean().withMessage('Ativo deve ser booleano'),
];
/**
 * Validação para buscar cliente por ID
 */
exports.validateGetCliente = [
    (0, express_validator_1.param)('id')
        .isInt({ gt: 0 }).withMessage('ID deve ser um número inteiro positivo'),
];
/**
 * Middleware para tratar erros de validação
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (errors.isEmpty()) {
        return next();
    }
    const formattedErrors = errors.array().map(error => ({
        field: error.param || error.path || 'unknown',
        message: error.msg,
        ...error.value !== undefined && { value: error.value }
    }));
    return res.status(400).json({
        message: 'Erro de validação',
        errors: formattedErrors
    });
};
exports.handleValidationErrors = handleValidationErrors;
//# sourceMappingURL=clienteValidator.js.map