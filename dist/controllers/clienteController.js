"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listActive = exports.remove = exports.update = exports.create = exports.show = exports.list = void 0;
const clienteService_1 = require("../services/clienteService");
const AppError_1 = require("../middlewares/AppError");
const logger_1 = require("../utils/logger");
// Listar clientes com filtros e paginação
const list = async (req, res, next) => {
    try {
        const { page = '1', limit = '10', sortBy = 'nome', sortOrder = 'asc', nome, tipo, ativo, search, email } = req.query;
        // Validar e converter parâmetros de paginação
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        if (isNaN(pageNumber) || pageNumber < 1) {
            throw new AppError_1.AppError('Parâmetro "page" deve ser um número maior que 0', 400);
        }
        if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
            throw new AppError_1.AppError('Parâmetro "limit" deve ser um número entre 1 e 100', 400);
        }
        // Construir filtros
        const filters = {};
        if (nome)
            filters.nome = nome;
        if (tipo)
            filters.tipo = tipo;
        if (email)
            filters.email = email;
        if (search)
            filters.search = search;
        if (ativo !== undefined) {
            if (ativo === 'true')
                filters.ativo = true;
            else if (ativo === 'false')
                filters.ativo = false;
        }
        // Opções de paginação
        const pagination = {
            page: pageNumber,
            limit: limitNumber,
            sortBy: sortBy,
            sortOrder: sortOrder
        };
        const result = await clienteService_1.clienteService.getAllClientes(filters, pagination);
        logger_1.logger.info('Listagem de clientes executada com sucesso', {
            total: result.pagination.total,
            page: pageNumber,
            limit: limitNumber,
            userId: req.user?.id
        });
        res.status(200).json({
            success: true,
            message: 'Clientes listados com sucesso',
            data: result.data,
            pagination: result.pagination
        });
    }
    catch (error) {
        next(error);
    }
};
exports.list = list;
// Buscar cliente por ID
const show = async (req, res, next) => {
    try {
        const { id } = req.params;
        const clienteId = parseInt(id, 10);
        if (isNaN(clienteId)) {
            throw new AppError_1.AppError('ID do cliente deve ser um número válido', 400);
        }
        const cliente = await clienteService_1.clienteService.getClienteById(clienteId);
        logger_1.logger.info('Cliente encontrado com sucesso', {
            clienteId,
            userId: req.user?.id
        });
        res.status(200).json({
            success: true,
            message: 'Cliente encontrado com sucesso',
            data: cliente
        });
    }
    catch (error) {
        next(error);
    }
};
exports.show = show;
// Criar novo cliente
const create = async (req, res, next) => {
    try {
        const clienteData = req.body;
        // Validações adicionais se necessário
        if (!clienteData.nome || clienteData.nome.trim().length === 0) {
            throw new AppError_1.AppError('Nome do cliente é obrigatório', 400);
        }
        if (!clienteData.tipo || !['PF', 'PJ'].includes(clienteData.tipo)) {
            throw new AppError_1.AppError('Tipo do cliente deve ser PF ou PJ', 400);
        }
        const novoCliente = await clienteService_1.clienteService.createCliente(clienteData);
        logger_1.logger.info('Cliente criado com sucesso', {
            clienteId: novoCliente.id,
            nome: novoCliente.nome,
            userId: req.user?.id
        });
        res.status(201).json({
            success: true,
            message: 'Cliente criado com sucesso',
            data: novoCliente
        });
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
// Atualizar cliente
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const clienteId = parseInt(id, 10);
        if (isNaN(clienteId)) {
            throw new AppError_1.AppError('ID do cliente deve ser um número válido', 400);
        }
        const updateData = req.body;
        // Validações adicionais
        if (updateData.nome !== undefined && updateData.nome.trim().length === 0) {
            throw new AppError_1.AppError('Nome do cliente não pode estar vazio', 400);
        }
        if (updateData.tipo !== undefined && !['PF', 'PJ'].includes(updateData.tipo)) {
            throw new AppError_1.AppError('Tipo do cliente deve ser PF ou PJ', 400);
        }
        const clienteAtualizado = await clienteService_1.clienteService.updateCliente(clienteId, updateData);
        logger_1.logger.info('Cliente atualizado com sucesso', {
            clienteId,
            nome: clienteAtualizado.nome,
            userId: req.user?.id
        });
        res.status(200).json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            data: clienteAtualizado
        });
    }
    catch (error) {
        next(error);
    }
};
exports.update = update;
// Remover cliente (soft delete)
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const clienteId = parseInt(id, 10);
        if (isNaN(clienteId)) {
            throw new AppError_1.AppError('ID do cliente deve ser um número válido', 400);
        }
        await clienteService_1.clienteService.deleteCliente(clienteId);
        logger_1.logger.info('Cliente removido com sucesso', {
            clienteId,
            userId: req.user?.id
        });
        res.status(200).json({
            success: true,
            message: 'Cliente removido com sucesso'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.remove = remove;
// Buscar clientes ativos (endpoint adicional útil)
const listActive = async (req, res, next) => {
    try {
        const { page = '1', limit = '50' } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 50;
        const filters = { ativo: true };
        const pagination = {
            page: pageNumber,
            limit: limitNumber,
            sortBy: 'nome',
            sortOrder: 'asc'
        };
        const result = await clienteService_1.clienteService.getAllClientes(filters, pagination);
        res.status(200).json({
            success: true,
            message: 'Clientes ativos listados com sucesso',
            data: result.data,
            pagination: result.pagination
        });
    }
    catch (error) {
        next(error);
    }
};
exports.listActive = listActive;
//# sourceMappingURL=clienteController.js.map