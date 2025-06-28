"use strict";
// src/services/clienteService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.clienteService = exports.ClienteService = void 0;
const client_1 = require("@prisma/client");
const AppError_1 = require("../middlewares/AppError");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class ClienteService {
    async getAllClientes(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'nome', sortOrder = 'asc' } = pagination;
            const { nome, tipo, ativo, search, email } = filters;
            // Construir condições de filtro
            const where = {};
            if (nome) {
                where.nome = {
                    contains: nome,
                    mode: 'insensitive'
                };
            }
            if (tipo) {
                where.tipo = tipo;
            }
            if (typeof ativo === 'boolean') {
                where.ativo = ativo;
            }
            if (email) {
                where.email = {
                    contains: email,
                    mode: 'insensitive'
                };
            }
            if (search) {
                where.OR = [
                    { nome: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { cnpjCpf: { contains: search } }
                ];
            }
            // Calcular offset para paginação
            const offset = (page - 1) * limit;
            // Buscar clientes
            const [clientes, total] = await Promise.all([
                prisma.cliente.findMany({
                    where,
                    orderBy: {
                        [sortBy]: sortOrder
                    },
                    skip: offset,
                    take: limit
                }),
                prisma.cliente.count({ where })
            ]);
            const totalPages = Math.ceil(total / limit);
            // Mapear para DTO de resposta
            const clientesFormatted = clientes.map(cliente => ({
                id: cliente.id,
                nome: cliente.nome,
                tipo: cliente.tipo,
                cnpjCpf: cliente.cnpjCpf,
                email: cliente.email,
                telefone: cliente.telefone,
                endereco: cliente.endereco,
                ativo: cliente.ativo,
                createdAt: cliente.createdAt,
                updatedAt: cliente.updatedAt
            }));
            logger_1.logger.info('Clientes listados com sucesso', {
                total,
                page,
                limit,
                totalPages,
                filters
            });
            return {
                data: clientesFormatted,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao listar clientes', {
                error: error instanceof Error ? error.message : error,
                filters
            });
            throw new AppError_1.AppError('Erro interno do servidor ao listar clientes.', 500);
        }
    }
    async getClienteById(id) {
        try {
            const cliente = await prisma.cliente.findUnique({
                where: { id }
            });
            if (!cliente) {
                throw new AppError_1.AppError('Cliente não encontrado.', 404);
            }
            logger_1.logger.info('Cliente encontrado com sucesso', { clienteId: id });
            return {
                id: cliente.id,
                nome: cliente.nome,
                tipo: cliente.tipo,
                cnpjCpf: cliente.cnpjCpf,
                email: cliente.email,
                telefone: cliente.telefone,
                endereco: cliente.endereco,
                ativo: cliente.ativo,
                createdAt: cliente.createdAt,
                updatedAt: cliente.updatedAt
            };
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Erro ao buscar cliente por ID', {
                error: error instanceof Error ? error.message : error,
                clienteId: id
            });
            throw new AppError_1.AppError('Erro interno do servidor ao buscar cliente.', 500);
        }
    }
    async createCliente(data) {
        try {
            // Verificar se já existe cliente com mesmo CNPJ/CPF (se fornecido)
            if (data.cnpjCpf) {
                const existingCliente = await prisma.cliente.findUnique({
                    where: { cnpjCpf: data.cnpjCpf }
                });
                if (existingCliente) {
                    throw new AppError_1.AppError('Já existe um cliente cadastrado com este CNPJ/CPF.', 409);
                }
            }
            // Verificar se já existe cliente com mesmo email (se fornecido)
            if (data.email) {
                const existingEmail = await prisma.cliente.findUnique({
                    where: { email: data.email }
                });
                if (existingEmail) {
                    throw new AppError_1.AppError('Já existe um cliente cadastrado com este email.', 409);
                }
            }
            const cliente = await prisma.cliente.create({
                data: {
                    nome: data.nome,
                    tipo: data.tipo,
                    cnpjCpf: data.cnpjCpf || null,
                    email: data.email || null,
                    telefone: data.telefone || null,
                    endereco: data.endereco || null,
                    ativo: data.ativo ?? true
                }
            });
            logger_1.logger.info('Cliente criado com sucesso', {
                clienteId: cliente.id,
                nome: cliente.nome
            });
            return {
                id: cliente.id,
                nome: cliente.nome,
                tipo: cliente.tipo,
                cnpjCpf: cliente.cnpjCpf,
                email: cliente.email,
                telefone: cliente.telefone,
                endereco: cliente.endereco,
                ativo: cliente.ativo,
                createdAt: cliente.createdAt,
                updatedAt: cliente.updatedAt
            };
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Erro ao criar cliente', {
                error: error instanceof Error ? error.message : error,
                data
            });
            throw new AppError_1.AppError('Erro interno do servidor ao criar cliente.', 500);
        }
    }
    async updateCliente(id, data) {
        try {
            // Verificar se o cliente existe
            const existingCliente = await prisma.cliente.findUnique({
                where: { id }
            });
            if (!existingCliente) {
                throw new AppError_1.AppError('Cliente não encontrado.', 404);
            }
            // Verificar conflitos de CNPJ/CPF se fornecido
            if (data.cnpjCpf && data.cnpjCpf !== existingCliente.cnpjCpf) {
                const existingCnpjCpf = await prisma.cliente.findUnique({
                    where: { cnpjCpf: data.cnpjCpf }
                });
                if (existingCnpjCpf) {
                    throw new AppError_1.AppError('Já existe um cliente cadastrado com este CNPJ/CPF.', 409);
                }
            }
            // Verificar conflitos de email se fornecido
            if (data.email && data.email !== existingCliente.email) {
                const existingEmail = await prisma.cliente.findUnique({
                    where: { email: data.email }
                });
                if (existingEmail) {
                    throw new AppError_1.AppError('Já existe um cliente cadastrado com este email.', 409);
                }
            }
            const cliente = await prisma.cliente.update({
                where: { id },
                data: {
                    ...(data.nome !== undefined && { nome: data.nome }),
                    ...(data.tipo !== undefined && { tipo: data.tipo }),
                    ...(data.cnpjCpf !== undefined && { cnpjCpf: data.cnpjCpf }),
                    ...(data.email !== undefined && { email: data.email }),
                    ...(data.telefone !== undefined && { telefone: data.telefone }),
                    ...(data.endereco !== undefined && { endereco: data.endereco }),
                    ...(data.ativo !== undefined && { ativo: data.ativo })
                }
            });
            logger_1.logger.info('Cliente atualizado com sucesso', {
                clienteId: id,
                nome: cliente.nome
            });
            return {
                id: cliente.id,
                nome: cliente.nome,
                tipo: cliente.tipo,
                cnpjCpf: cliente.cnpjCpf,
                email: cliente.email,
                telefone: cliente.telefone,
                endereco: cliente.endereco,
                ativo: cliente.ativo,
                createdAt: cliente.createdAt,
                updatedAt: cliente.updatedAt
            };
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Erro ao atualizar cliente', {
                error: error instanceof Error ? error.message : error,
                clienteId: id,
                data
            });
            throw new AppError_1.AppError('Erro interno do servidor ao atualizar cliente.', 500);
        }
    }
    async deleteCliente(id) {
        try {
            // Verificar se o cliente existe
            const existingCliente = await prisma.cliente.findUnique({
                where: { id }
            });
            if (!existingCliente) {
                throw new AppError_1.AppError('Cliente não encontrado.', 404);
            }
            // Soft delete - apenas desativar o cliente ao invés de deletar
            await prisma.cliente.update({
                where: { id },
                data: { ativo: false }
            });
            logger_1.logger.info('Cliente desativado com sucesso', {
                clienteId: id,
                nome: existingCliente.nome
            });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Erro ao deletar cliente', {
                error: error instanceof Error ? error.message : error,
                clienteId: id
            });
            throw new AppError_1.AppError('Erro interno do servidor ao deletar cliente.', 500);
        }
    }
}
exports.ClienteService = ClienteService;
// Instanciar e exportar o service
exports.clienteService = new ClienteService();
//# sourceMappingURL=clienteService.js.map