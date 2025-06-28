"use strict";
// src/middlewares/clienteValidator.ts - VERSÃO CORRIGIDA E CENTRALIZADA
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdParam = exports.validateListClientes = exports.validateUpdateCliente = exports.validateCreateCliente = void 0;
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const cpf_cnpj_validator_1 = require("cpf-cnpj-validator"); // Usando uma biblioteca para robustez
const ALLOWED_TIPO_CLIENTE = Object.values(client_1.$Enums.TipoCliente);
// Validação para CRIAÇÃO de Cliente
exports.validateCreateCliente = [
    (0, express_validator_1.body)('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 3, max: 100 }).escape(),
    (0, express_validator_1.body)('tipo').isIn(ALLOWED_TIPO_CLIENTE).withMessage(`Tipo deve ser um dos seguintes: ${ALLOWED_TIPO_CLIENTE.join(', ')}.`),
    (0, express_validator_1.body)('cnpjCpf').trim().notEmpty().withMessage('CNPJ/CPF é obrigatório.').custom((value, { req }) => {
        const tipo = req.body.tipo;
        const cleanValue = String(value).replace(/\D/g, '');
        if (tipo === 'PF' && !cpf_cnpj_validator_1.cpf.isValid(cleanValue)) {
            throw new Error('CPF fornecido é inválido.');
        }
        if (tipo === 'PJ' && !cpf_cnpj_validator_1.cnpj.isValid(cleanValue)) {
            throw new Error('CNPJ fornecido é inválido.');
        }
        return true;
    }),
    (0, express_validator_1.body)('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
    (0, express_validator_1.body)('telefone').optional({ checkFalsy: true }).isString().trim().escape(),
    (0, express_validator_1.body)('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano.'),
];
// Validação para ATUALIZAÇÃO de Cliente
exports.validateUpdateCliente = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID inválido.'),
    (0, express_validator_1.body)('nome').optional().trim().notEmpty().isLength({ min: 3, max: 100 }).escape(),
    (0, express_validator_1.body)('tipo').optional().isIn(ALLOWED_TIPO_CLIENTE),
    (0, express_validator_1.body)('cnpjCpf').optional().trim().custom((value, { req }) => {
        // Esta validação pode ser mais complexa se o tipo também puder ser alterado.
        // Por simplicidade, validamos apenas se o tipo for fornecido na mesma requisição.
        const tipo = req.body.tipo;
        if (value && tipo) {
            const cleanValue = String(value).replace(/\D/g, '');
            if (tipo === 'PF' && !cpf_cnpj_validator_1.cpf.isValid(cleanValue))
                throw new Error('CPF inválido para o tipo PF.');
            if (tipo === 'PJ' && !cpf_cnpj_validator_1.cnpj.isValid(cleanValue))
                throw new Error('CNPJ inválido para o tipo PJ.');
        }
        return true;
    }),
    (0, express_validator_1.body)('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
    (0, express_validator_1.body)('telefone').optional({ checkFalsy: true }).isString().trim().escape(),
    (0, express_validator_1.body)('ativo').optional().isBoolean(),
];
// Validação para PARÂMETROS DE BUSCA (Query)
exports.validateListClientes = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um inteiro positivo.').toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100.').toInt(),
    (0, express_validator_1.query)('sortBy').optional().isString().trim().escape(),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
    (0, express_validator_1.query)('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano.').toBoolean(),
];
// Validação para ID em PARÂMETROS de Rota
exports.validateIdParam = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID na rota é inválido.').toInt()
];
//# sourceMappingURL=clienteValidator.js.map