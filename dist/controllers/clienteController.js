"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.show = exports.list = void 0;
const express_validator_1 = require("express-validator");
const clienteService_1 = require("../services/clienteService"); // Caminho ajustado (verifique o seu)
const client_1 = require("@prisma/client");
const AppError_1 = require("../errors/AppError");
const logger_1 = require("../utils/logger");
const cpf_cnpj_validator_1 = require("cpf-cnpj-validator"); // Para validações customizadas
// Helper para lidar com erros de validação
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        logger_1.logger.warn('Erro de validação de entrada no clienteController', {
            errors: errors.array({ onlyFirstError: true }), path: req.path, method: req.method,
        });
        return next(new AppError_1.ValidationError(errors.array({ onlyFirstError: true }), 'Dados de entrada inválidos.'));
    }
    next();
};
exports.list = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt().withMessage('Página deve ser um número inteiro positivo.'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limite deve ser um número inteiro entre 1 e 100.'),
    (0, express_validator_1.query)('sortBy').optional().isString().trim().escape(),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordem de classificação deve ser "asc" ou "desc".'),
    (0, express_validator_1.query)('nome').optional().isString().trim().escape(),
    (0, express_validator_1.query)('tipo').optional().isIn(Object.values(client_1.$Enums.TipoCliente))
        .withMessage(`Tipo de cliente inválido. Use ${Object.values(client_1.$Enums.TipoCliente).join(' ou ')}.`),
    (0, express_validator_1.query)('ativo').optional().isBoolean({ strict: false }).toBoolean().withMessage('Valor para "ativo" deve ser booleano.'),
    (0, express_validator_1.query)('search').optional().isString().trim().escape(),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            // Usando 'queryParamsFromValidation' para clareza que vem de matchedData
            const queryParamsFromValidation = (0, express_validator_1.matchedData)(req, { locations: ['query'] });
            // Assumindo que ClienteFilters em clienteDtos.ts tem todos os campos como opcionais (prop?: Tipo)
            const filters = {
                nome: queryParamsFromValidation.nome,
                tipo: queryParamsFromValidation.tipo, // Cast após validação isIn
                ativo: queryParamsFromValidation.ativo,
                search: queryParamsFromValidation.search,
                email: queryParamsFromValidation.email,
            };
            const pagination = {
                page: queryParamsFromValidation.page,
                limit: queryParamsFromValidation.limit,
                sortBy: queryParamsFromValidation.sortBy,
                sortOrder: queryParamsFromValidation.sortOrder, // CORRIGIDO: Usando queryParamsFromValidation
            };
            const result = await clienteService_1.clienteService.getAllClientes(filters, pagination);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
];
exports.show = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt().withMessage('ID inválido ou não fornecido.'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            // 'id' aqui é garantido como number pelo .toInt() e pela validação
            const { id } = (0, express_validator_1.matchedData)(req, { locations: ['params'] });
            const cliente = await clienteService_1.clienteService.getClienteById(id);
            res.json(cliente);
        }
        catch (error) {
            next(error);
        }
    },
];
exports.create = [
    (0, express_validator_1.body)('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 3, max: 100 }).escape(),
    (0, express_validator_1.body)('tipo').isIn(Object.values(client_1.$Enums.TipoCliente)).withMessage(`Tipo deve ser um dos seguintes: ${Object.values(client_1.$Enums.TipoCliente).join(', ')}.`),
    // CORRIGIDO: Se cnpjCpf é obrigatório em CreateClienteDTO, a validação deve refletir isso.
    // Se for opcional no DTO, mantenha .optional().
    // Vou assumir que é obrigatório conforme o erro TS2741.
    (0, express_validator_1.body)('cnpjCpf').trim().notEmpty().withMessage('CNPJ/CPF é obrigatório.')
        .isString().withMessage('CNPJ/CPF deve ser string.')
        .custom((value, { req }) => {
        const tipo = req.body.tipo; // O tipo já foi validado para ser do enum
        const cleanValue = String(value).replace(/\D/g, '');
        if (tipo === client_1.$Enums.TipoCliente.PF && !cpf_cnpj_validator_1.cpf.isValid(cleanValue)) {
            throw new Error('CPF fornecido é inválido.');
        }
        if (tipo === client_1.$Enums.TipoCliente.PJ && !cpf_cnpj_validator_1.cnpj.isValid(cleanValue)) {
            throw new Error('CNPJ fornecido é inválido.');
        }
        return true;
    }),
    (0, express_validator_1.body)('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').toLowerCase().normalizeEmail(),
    (0, express_validator_1.body)('telefone').optional({ checkFalsy: true }).isString().trim().escape(),
    (0, express_validator_1.body)('endereco').optional({ checkFalsy: true }).isString().trim().escape(),
    (0, express_validator_1.body)('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano.'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const rawValidatedData = (0, express_validator_1.matchedData)(req, { locations: ['body'] });
            // CORRIGIDO: Garante que todos os campos de CreateClienteDTO são preenchidos
            // (os opcionais podem vir como undefined de matchedData se não enviados)
            const validatedData = {
                nome: rawValidatedData.nome, // Obrigatório pela validação
                tipo: rawValidatedData.tipo, // Obrigatório pela validação
                cnpjCpf: rawValidatedData.cnpjCpf, // Obrigatório pela validação (conforme correção acima)
                email: rawValidatedData.email, // Opcional
                telefone: rawValidatedData.telefone,
                endereco: rawValidatedData.endereco,
                ativo: rawValidatedData.ativo, // Opcional
            };
            const cliente = await clienteService_1.clienteService.createCliente(validatedData);
            res.status(201).json(cliente);
        }
        catch (error) {
            next(error);
        }
    },
];
exports.update = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt().withMessage('ID inválido ou não fornecido.'),
    (0, express_validator_1.body)('nome').optional().trim().notEmpty({ ignore_whitespace: true }).withMessage('Nome não pode ser apenas espaços se fornecido.').isLength({ min: 3, max: 100 }).escape(),
    (0, express_validator_1.body)('tipo').optional().isIn(Object.values(client_1.$Enums.TipoCliente)).withMessage(`Tipo deve ser um dos seguintes: ${Object.values(client_1.$Enums.TipoCliente).join(', ')}.`),
    // Validação para CNPJ/CPF no update (semelhante ao create, mas opcional)
    (0, express_validator_1.body)('cnpjCpf').optional({ checkFalsy: true }).isString().trim()
        .custom((value, { req }) => {
        // Se está atualizando cnpjCpf, o tipo também deve ser fornecido ou validado contra o tipo existente.
        // Esta validação customizada pode precisar ser mais complexa se 'tipo' não for fornecido no DTO de update.
        // Por simplicidade, se cnpjCpf for fornecido, idealmente o tipo também seria, ou o tipo atual do cliente seria usado.
        const tipoParaValidar = req.body.tipo || req.clienteExistente?.tipo; // Exemplo: necessitaria buscar cliente antes
        if (value && tipoParaValidar) {
            const cleanValue = String(value).replace(/\D/g, '');
            if (tipoParaValidar === client_1.$Enums.TipoCliente.PF && !cpf_cnpj_validator_1.cpf.isValid(cleanValue))
                throw new Error('CPF fornecido é inválido.');
            if (tipoParaValidar === client_1.$Enums.TipoCliente.PJ && !cpf_cnpj_validator_1.cnpj.isValid(cleanValue))
                throw new Error('CNPJ fornecido é inválido.');
        }
        return true;
    }),
    (0, express_validator_1.body)('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').toLowerCase().normalizeEmail(),
    (0, express_validator_1.body)('telefone').optional({ checkFalsy: true }).isString().trim().escape(),
    (0, express_validator_1.body)('endereco').optional({ checkFalsy: true }).isString().trim().escape(),
    (0, express_validator_1.body)('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano.'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { id } = (0, express_validator_1.matchedData)(req, { locations: ['params'] });
            const rawValidatedData = (0, express_validator_1.matchedData)(req, { locations: ['body'] });
            if (Object.keys(rawValidatedData).length === 0) {
                res.status(304).send();
                return;
            }
            // Mapeamento para UpdateClienteDTO, garantindo tipos corretos
            const validatedData = {
                ...rawValidatedData,
                // Se 'tipo' estiver presente em rawValidatedData, faça o cast
                // E se UpdateClienteDTO.tipo for opcional, está ok.
                ...(rawValidatedData.tipo && { tipo: rawValidatedData.tipo })
            };
            const cliente = await clienteService_1.clienteService.updateCliente(id, validatedData);
            res.json(cliente);
        }
        catch (error) {
            next(error);
        }
    },
];
exports.remove = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt().withMessage('ID inválido ou não fornecido.'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { id } = (0, express_validator_1.matchedData)(req, { locations: ['params'] });
            await clienteService_1.clienteService.deleteCliente(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
];
//# sourceMappingURL=clienteController.js.map