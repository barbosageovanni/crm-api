"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateTransporte = exports.validateCreateTransporte = exports.deleteTransporte = exports.updateTransporte = exports.createTransporte = exports.getTransporteById = exports.getTransportes = void 0;
console.log("LOG: transporteController.ts está sendo carregado");
const client_1 = require("@prisma/client");
const transporteService_1 = require("../services/transporteService");
// Solução alternativa com importações individuais
const express_validator_1 = require("express-validator");
const express_validator_2 = require("express-validator");
const prisma = new client_1.PrismaClient();
// Listar todos os transportes
const getTransportes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const clienteId = req.query.clienteId ? parseInt(req.query.clienteId) : undefined;
        const search = req.query.search;
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;
        const sortBy = req.query.sortBy || 'dataOperacao';
        const sortOrder = req.query.sortOrder || 'desc';
        const filters = {
            clienteId,
            search,
            dateFrom,
            dateTo
        };
        const pagination = {
            page,
            limit,
            sortBy,
            sortOrder
        };
        const result = await transporteService_1.transporteService.getAllTransportes(filters, pagination);
        res.json(result);
    }
    catch (error) {
        console.error('Erro ao buscar transportes:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível buscar os transportes'
        });
    }
};
exports.getTransportes = getTransportes;
// Buscar transporte por ID
const getTransporteById = async (req, res) => {
    try {
        const { id } = req.params;
        const transporte = await transporteService_1.transporteService.getTransporteById(parseInt(id));
        res.json(transporte);
    }
    catch (error) {
        console.error('Erro ao buscar transporte:', error);
        if (error.name === 'NotFoundError') {
            res.status(404).json({
                error: 'Transporte não encontrado',
                message: error.message
            });
            return;
        }
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível buscar o transporte'
        });
    }
};
exports.getTransporteById = getTransporteById;
// Criar novo transporte
const createTransporte = async (req, res) => {
    try {
        const errors = (0, express_validator_2.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Dados inválidos',
                errors: errors.array()
            });
            return;
        }
        const { clienteId, numeroCteOc, dataOperacao, valorTotal, placaVeiculo, fatura, valorFrete, observacoes, dataColeta, 
        // dataEntregaPrevista removido
        dataEnvioFaturamento, dataVencimento, dataAtesto, dataNotaFiscal, descricaoNotaFiscal, status } = req.body;
        // Validações básicas
        if (!clienteId || !numeroCteOc || !dataOperacao || !valorTotal) {
            res.status(400).json({
                error: 'Dados obrigatórios ausentes',
                message: 'Cliente, número CTE/OC, data de operação e valor total são obrigatórios'
            });
            return;
        }
        const transporte = await transporteService_1.transporteService.createTransporte({
            clienteId,
            numeroCteOc,
            dataOperacao,
            valorTotal,
            placaVeiculo,
            fatura,
            valorFrete,
            observacoes,
            dataColeta,
            // dataEntregaPrevista removido
            dataEnvioFaturamento,
            dataVencimento,
            dataAtesto,
            dataNotaFiscal,
            descricaoNotaFiscal,
            status
        });
        res.status(201).json({
            message: 'Transporte criado com sucesso',
            transporte
        });
    }
    catch (error) {
        console.error('Erro ao criar transporte:', error);
        if (error.name === 'NotFoundError') {
            res.status(404).json({
                error: 'Recurso não encontrado',
                message: error.message
            });
            return;
        }
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível criar o transporte'
        });
    }
};
exports.createTransporte = createTransporte;
// Atualizar transporte
const updateTransporte = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = (0, express_validator_2.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Dados inválidos',
                errors: errors.array()
            });
            return;
        }
        const { numeroCteOc, dataOperacao, valorTotal, placaVeiculo, fatura, valorFrete, observacoes, dataColeta, 
        // dataEntregaPrevista removido
        dataEnvioFaturamento, dataVencimento, dataAtesto, dataNotaFiscal, descricaoNotaFiscal, status } = req.body;
        const transporte = await transporteService_1.transporteService.updateTransporte(parseInt(id), {
            numeroCteOc,
            dataOperacao,
            valorTotal,
            placaVeiculo,
            fatura,
            valorFrete,
            observacoes,
            dataColeta,
            // dataEntregaPrevista removido
            dataEnvioFaturamento,
            dataVencimento,
            dataAtesto,
            dataNotaFiscal,
            descricaoNotaFiscal,
            status
        });
        res.json({
            message: 'Transporte atualizado com sucesso',
            transporte
        });
    }
    catch (error) {
        console.error('Erro ao atualizar transporte:', error);
        if (error.name === 'NotFoundError') {
            res.status(404).json({
                error: 'Transporte não encontrado',
                message: error.message
            });
            return;
        }
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível atualizar o transporte'
        });
    }
};
exports.updateTransporte = updateTransporte;
// Deletar transporte
const deleteTransporte = async (req, res) => {
    try {
        const { id } = req.params;
        await transporteService_1.transporteService.deleteTransporte(parseInt(id));
        res.json({
            message: 'Transporte deletado com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao deletar transporte:', error);
        if (error.name === 'NotFoundError') {
            res.status(404).json({
                error: 'Transporte não encontrado',
                message: error.message
            });
            return;
        }
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível deletar o transporte'
        });
    }
};
exports.deleteTransporte = deleteTransporte;
// Validações para criação de transporte
exports.validateCreateTransporte = [
    (0, express_validator_1.body)('clienteId').isInt().withMessage('ID do cliente deve ser um número inteiro'),
    (0, express_validator_1.body)('numeroCteOc').isString().notEmpty().withMessage('Número CTE/OC é obrigatório'),
    (0, express_validator_1.body)('dataOperacao').isISO8601().withMessage('Data de operação deve ser uma data válida'),
    (0, express_validator_1.body)('valorTotal').isNumeric().withMessage('Valor total deve ser um número'),
    (0, express_validator_1.body)('placaVeiculo').optional().isString(),
    (0, express_validator_1.body)('fatura').optional().isString(),
    (0, express_validator_1.body)('valorFrete').optional().isNumeric().withMessage('Valor do frete deve ser um número'),
    (0, express_validator_1.body)('observacoes').optional().isString(),
    (0, express_validator_1.body)('dataColeta').optional().isISO8601().withMessage('Data de coleta deve ser uma data válida'),
    // dataEntregaPrevista removido
    (0, express_validator_1.body)('dataEnvioFaturamento').optional().isISO8601().withMessage('Data de envio para faturamento deve ser uma data válida'),
    (0, express_validator_1.body)('dataVencimento').optional().isISO8601().withMessage('Data de vencimento deve ser uma data válida'),
    (0, express_validator_1.body)('dataAtesto').optional().isISO8601().withMessage('Data de atesto deve ser uma data válida'),
    (0, express_validator_1.body)('dataNotaFiscal').optional().isISO8601().withMessage('Data da nota fiscal deve ser uma data válida'),
    (0, express_validator_1.body)('descricaoNotaFiscal').optional().isString(),
    (0, express_validator_1.body)('status').optional().isString()
];
// Validações para atualização de transporte
exports.validateUpdateTransporte = [
    (0, express_validator_1.body)('numeroCteOc').optional().isString().notEmpty().withMessage('Número CTE/OC não pode ser vazio'),
    (0, express_validator_1.body)('dataOperacao').optional().isISO8601().withMessage('Data de operação deve ser uma data válida'),
    (0, express_validator_1.body)('valorTotal').optional().isNumeric().withMessage('Valor total deve ser um número'),
    (0, express_validator_1.body)('placaVeiculo').optional().isString(),
    (0, express_validator_1.body)('fatura').optional().isString(),
    (0, express_validator_1.body)('valorFrete').optional().isNumeric().withMessage('Valor do frete deve ser um número'),
    (0, express_validator_1.body)('observacoes').optional().isString(),
    (0, express_validator_1.body)('dataColeta').optional().isISO8601().withMessage('Data de coleta deve ser uma data válida'),
    // dataEntregaPrevista removido
    (0, express_validator_1.body)('dataEnvioFaturamento').optional().isISO8601().withMessage('Data de envio para faturamento deve ser uma data válida'),
    (0, express_validator_1.body)('dataVencimento').optional().isISO8601().withMessage('Data de vencimento deve ser uma data válida'),
    (0, express_validator_1.body)('dataAtesto').optional().isISO8601().withMessage('Data de atesto deve ser uma data válida'),
    (0, express_validator_1.body)('dataNotaFiscal').optional().isISO8601().withMessage('Data da nota fiscal deve ser uma data válida'),
    (0, express_validator_1.body)('descricaoNotaFiscal').optional().isString(),
    (0, express_validator_1.body)('status').optional().isString()
];
//# sourceMappingURL=transporteController.js.map