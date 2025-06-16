"use strict";
// src/services/clienteService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.clienteService = void 0;
const client_1 = require("@prisma/client"); // Importe $Enums para TipoCliente
const AppError_1 = require("../errors/AppError");
const cpf_cnpj_validator_1 = require("cpf-cnpj-validator");
const logger_1 = require("../utils/logger");
const redis_1 = require("../config/redis");
class ClienteService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllClientes(filters, pagination) {
        const page = Math.max(1, pagination?.page || 1);
        const limit = Math.min(pagination?.limit || 10, 100);
        const skip = (page - 1) * limit;
        const where = this.buildWhereClause(filters);
        const orderBy = this.buildOrderBy(pagination);
        const cacheKey = `${redis_1.CACHE_KEYS.CLIENTE_LIST}:page:${page}:limit:${limit}:filters:${JSON.stringify(filters)}:orderBy:${JSON.stringify(orderBy)}`;
        try {
            const cachedResult = await redis_1.redisService.get(cacheKey);
            if (cachedResult) {
                logger_1.logger.info('Cache HIT para getAllClientes', { cacheKey });
                return cachedResult;
            }
        }
        catch (cacheError) { // Tipagem para cacheError
            const err = cacheError instanceof Error ? cacheError : new Error(String(cacheError));
            logger_1.logger.warn('Erro ao buscar clientes do cache', { cacheKey, error: err.message });
        }
        logger_1.logger.info('Cache MISS para getAllClientes', { cacheKey });
        try {
            // Para consistência, se o mock do Prisma no teste for mais simples,
            // pode ser melhor mockar findMany e count separadamente.
            // A transação aqui é boa para produção.
            const [clientes, total] = await this.prisma.$transaction([
                this.prisma.cliente.findMany({ where, orderBy, skip, take: limit }),
                this.prisma.cliente.count({ where })
            ]);
            const totalPages = Math.ceil(total / limit);
            const result = {
                data: clientes,
                pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
            };
            await redis_1.redisService.set(cacheKey, result, redis_1.CACHE_TTL.MEDIUM);
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Erro ao listar clientes', { originalError: err, originalMessage: err.message, filters, pagination });
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('Erro ao listar clientes.', 500);
        }
    }
    async getClienteById(id) {
        if (!id || id <= 0) {
            throw new AppError_1.ValidationError([], 'ID inválido');
        }
        const cacheKey = `${redis_1.CACHE_KEYS.CLIENTE_BY_ID}:${id}`;
        try {
            const cachedCliente = await redis_1.redisService.get(cacheKey);
            if (cachedCliente) {
                logger_1.logger.info('Cache HIT para getClienteById', { cacheKey });
                return cachedCliente;
            }
        }
        catch (cacheError) {
            const err = cacheError instanceof Error ? cacheError : new Error(String(cacheError));
            logger_1.logger.warn('Erro ao buscar cliente do cache por ID', { cacheKey, id, error: err.message });
        }
        logger_1.logger.info('Cache MISS para getClienteById', { cacheKey });
        try {
            const cliente = await this.prisma.cliente.findUnique({ where: { id } });
            if (!cliente) {
                throw new AppError_1.NotFoundError('Cliente', id);
            }
            await redis_1.redisService.set(cacheKey, cliente, redis_1.CACHE_TTL.MEDIUM);
            return cliente;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Erro ao buscar cliente por ID', { originalError: err, originalMessage: err.message, id });
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('Erro ao buscar cliente por ID.', 500);
        }
    }
    async createCliente(data) {
        await this.validateClienteData(data);
        if (data.cnpjCpf) { // Checa apenas se cnpjCpf foi fornecido
            await this.checkDuplicateCnpjCpf(data.cnpjCpf);
        }
        // Se o email for único no schema, adicione uma checagem de duplicidade para email também:
        // if (data.email) {
        //   await this.checkDuplicateEmail(data.email);
        // }
        const cleanData = this.sanitizeData(data);
        try {
            const cliente = await this.prisma.cliente.create({ data: cleanData });
            logger_1.logger.info('Cliente criado', { clienteId: cliente.id });
            await redis_1.redisService.del(`${redis_1.CACHE_KEYS.CLIENTE_LIST}:*`);
            return cliente;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Erro ao criar cliente no DB', { originalError: err, originalMessage: err.message, data });
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                const target = err.meta?.target || ['campo desconhecido'];
                const fieldName = target.join(', ');
                let problematicValue = 'valor não especificado';
                if (target.includes('cnpjCpf') && data.cnpjCpf) {
                    problematicValue = data.cnpjCpf;
                }
                else if (target.includes('email') && data.email) {
                    problematicValue = data.email;
                }
                throw new AppError_1.DuplicateError(fieldName, problematicValue);
            }
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('Erro ao criar cliente.', 500);
        }
    }
    async updateCliente(id, data) {
        const existingCliente = await this.getClienteById(id); // Verifica existência e pega dados atuais
        // Validação de CNPJ/CPF apenas se estiver sendo alterado e tipo for fornecido
        if (data.cnpjCpf && data.cnpjCpf !== existingCliente.cnpjCpf) {
            if (!data.tipo) {
                throw new AppError_1.ValidationError([], 'O campo "tipo" (PF/PJ) é obrigatório ao atualizar o CPF/CNPJ para um novo valor.');
            }
            await this.validateCnpjCpf(data.cnpjCpf, data.tipo);
            await this.checkDuplicateCnpjCpf(data.cnpjCpf, id);
        }
        else if (data.cnpjCpf && !data.tipo && data.tipo !== existingCliente.tipo) {
            // Se está mudando o CNPJ/CPF, mas não informou o tipo (e o tipo antigo era diferente)
            throw new AppError_1.ValidationError([], 'O campo "tipo" (PF/PJ) é obrigatório se o tipo do cliente também estiver sendo alterado junto com o CPF/CNPJ.');
        }
        // Se o email estiver sendo alterado e for único, verificar duplicidade
        // if (data.email && data.email !== existingCliente.email) {
        //   await this.checkDuplicateEmail(data.email, id);
        // }
        const cleanData = this.sanitizeUpdateData(data);
        if (Object.keys(cleanData).length === 0) {
            logger_1.logger.info('Nenhum dado válido fornecido para atualização do cliente.', { clienteId: id });
            return existingCliente; // Retorna o cliente existente sem alteração
        }
        try {
            const cliente = await this.prisma.cliente.update({
                where: { id },
                data: cleanData // updatedAt é gerenciado pelo Prisma
            });
            logger_1.logger.info('Cliente atualizado', { clienteId: id });
            await redis_1.redisService.del(`${redis_1.CACHE_KEYS.CLIENTE_BY_ID}:${id}`);
            await redis_1.redisService.del(`${redis_1.CACHE_KEYS.CLIENTE_LIST}:*`);
            return cliente;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Erro ao atualizar cliente no DB', { originalError: err, originalMessage: err.message, id, data });
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                const target = err.meta?.target || ['campo desconhecido'];
                const fieldName = target.join(', ');
                let problematicValue = 'valor não especificado';
                if (target.includes('cnpjCpf') && data.cnpjCpf) {
                    problematicValue = data.cnpjCpf;
                }
                else if (target.includes('email') && data.email) {
                    problematicValue = data.email;
                }
                throw new AppError_1.DuplicateError(fieldName, problematicValue);
            }
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('Erro ao atualizar cliente.', 500);
        }
    }
    async deleteCliente(id) {
        await this.getClienteById(id); // Verifica existência
        try {
            await this.prisma.cliente.delete({ where: { id } });
            logger_1.logger.info('Cliente deletado', { clienteId: id });
            await redis_1.redisService.del(`${redis_1.CACHE_KEYS.CLIENTE_BY_ID}:${id}`);
            await redis_1.redisService.del(`${redis_1.CACHE_KEYS.CLIENTE_LIST}:*`);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Erro ao deletar cliente', { originalError: err, originalMessage: err.message, id });
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('Erro ao deletar cliente.', 500);
        }
    }
    validateCnpjCpf(cnpjCpfValue, tipo) {
        const cleanValue = cnpjCpfValue.replace(/\D/g, '');
        if (tipo === client_1.$Enums.TipoCliente.PF) {
            if (!cpf_cnpj_validator_1.cpf.isValid(cleanValue))
                throw new AppError_1.ValidationError([], 'CPF inválido');
        }
        else if (tipo === client_1.$Enums.TipoCliente.PJ) {
            if (!cpf_cnpj_validator_1.cnpj.isValid(cleanValue))
                throw new AppError_1.ValidationError([], 'CNPJ inválido');
        }
    }
    async validateClienteData(data) {
        if (!data.nome?.trim())
            throw new AppError_1.ValidationError([], 'Nome é obrigatório');
        if (!data.tipo)
            throw new AppError_1.ValidationError([], 'Tipo (PF/PJ) é obrigatório');
        // Valida se o tipo fornecido é um membro do enum TipoCliente
        if (!Object.values(client_1.$Enums.TipoCliente).includes(data.tipo)) {
            throw new AppError_1.ValidationError([], 'Tipo deve ser PF ou PJ');
        }
        if (data.cnpjCpf) {
            this.validateCnpjCpf(data.cnpjCpf, data.tipo); // Cast seguro após validação acima
        }
        if (data.email && !this.isValidEmail(data.email)) { // Verifica se email existe no DTO
            throw new AppError_1.ValidationError([], 'Email inválido');
        }
    }
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    // Refatorado para usar Prisma.ClienteCreateInput e evitar 'any'
    sanitizeData(data) {
        const sanitizedInput = {
            nome: data.nome.trim(),
            tipo: data.tipo, // data.tipo já deve ser do tipo $Enums.TipoCliente após validateClienteData
        };
        if (data.cnpjCpf !== undefined) {
            sanitizedInput.cnpjCpf = data.cnpjCpf ? data.cnpjCpf.replace(/\D/g, '') : null;
        }
        if (data.email !== undefined) {
            sanitizedInput.email = data.email ? data.email.toLowerCase().trim() : null;
        }
        if (data.telefone !== undefined) {
            sanitizedInput.telefone = data.telefone ? data.telefone.replace(/\D/g, '') : null;
        }
        if (data.endereco !== undefined) {
            sanitizedInput.endereco = data.endereco ? data.endereco.trim() : null;
        }
        if (data.ativo !== undefined) { // Se CreateClienteDTO permitir definir 'ativo'
            sanitizedInput.ativo = data.ativo;
        }
        // createdAt e updatedAt são gerenciados pelo Prisma
        return sanitizedInput;
    }
    // Refatorado para usar Prisma.ClienteUpdateInput e evitar 'any'
    sanitizeUpdateData(data) {
        const updateInput = {};
        if (data.nome !== undefined)
            updateInput.nome = data.nome.trim();
        if (data.cnpjCpf !== undefined)
            updateInput.cnpjCpf = data.cnpjCpf ? data.cnpjCpf.replace(/\D/g, '') : null;
        if (data.tipo !== undefined)
            updateInput.tipo = data.tipo; // Assume que data.tipo é $Enums.TipoCliente
        if (data.email !== undefined)
            updateInput.email = data.email ? data.email.toLowerCase().trim() : null;
        if (data.telefone !== undefined)
            updateInput.telefone = data.telefone ? data.telefone.replace(/\D/g, '') : null;
        if (data.endereco !== undefined)
            updateInput.endereco = data.endereco ? data.endereco.trim() : null;
        if (data.ativo !== undefined)
            updateInput.ativo = data.ativo;
        return updateInput;
    }
    async checkDuplicateCnpjCpf(cnpjCpf, excludeId) {
        const cleanCnpjCpf = cnpjCpf.replace(/\D/g, '');
        const existing = await this.prisma.cliente.findFirst({
            where: {
                cnpjCpf: cleanCnpjCpf,
                AND: excludeId ? { id: { not: excludeId } } : {}, // Mais seguro que spread
            },
        });
        if (existing) {
            throw new AppError_1.DuplicateError('CPF/CNPJ', cnpjCpf);
        }
    }
    // Adicionar checkDuplicateEmail se email for único:
    // private async checkDuplicateEmail(email: string, excludeId?: number): Promise<void> {
    //   const existing = await this.prisma.cliente.findFirst({
    //     where: {
    //       email: email.toLowerCase().trim(),
    //       AND: excludeId ? { id: { not: excludeId } } : {},
    //     },
    //   });
    //   if (existing) {
    //     throw new DuplicateError('Email', email);
    //   }
    // }
    buildWhereClause(filters) {
        if (!filters)
            return {};
        const where = {};
        if (filters.nome) {
            where.nome = { contains: filters.nome, mode: 'insensitive' };
        }
        // IMPORTANTE: Certifique-se que filters.tipo no DTO ClienteFilters é do tipo $Enums.TipoCliente
        if (filters.tipo) {
            where.tipo = { equals: filters.tipo }; // Usar 'equals' para enums é mais explícito
        }
        if (filters.ativo !== undefined) {
            where.ativo = filters.ativo;
        }
        if (filters.search) {
            const searchCleaned = filters.search.replace(/\D/g, '');
            const orConditions = [
                { nome: { contains: filters.search, mode: 'insensitive' } },
                // Se quiser busca por email no search geral:
                // { email: { contains: filters.search, mode: 'insensitive' } },
            ];
            if (searchCleaned.length > 0) {
                orConditions.push({ cnpjCpf: { contains: searchCleaned } });
            }
            where.OR = orConditions;
        }
        return where;
    }
    buildOrderBy(pagination) {
        // Os campos permitidos para ordenação devem existir no modelo Cliente
        const allowedSortByFields = ['id', 'nome', 'tipo', 'cnpjCpf', 'ativo', 'email', 'createdAt', 'updatedAt'];
        let sortBy = 'id'; // Campo padrão para ordenação
        let sortOrder = 'desc'; // Ordem padrão
        if (pagination?.sortBy && allowedSortByFields.includes(pagination.sortBy)) {
            sortBy = pagination.sortBy;
        }
        else if (pagination?.sortBy) {
            logger_1.logger.warn(`Tentativa de ordenação por campo inválido: ${pagination.sortBy}. Usando padrão (id desc).`);
        }
        if (pagination?.sortOrder && ['asc', 'desc'].includes(pagination.sortOrder)) {
            sortOrder = pagination.sortOrder;
        }
        return { [sortBy]: sortOrder };
    }
}
// Instância Singleton
const prisma = new client_1.PrismaClient(); // Considere adicionar opções de log do Prisma aqui
const clienteServiceInstance = new ClienteService(prisma);
// Exporta um objeto com os métodos do serviço
exports.clienteService = {
    getAllClientes: clienteServiceInstance.getAllClientes.bind(clienteServiceInstance),
    getClienteById: clienteServiceInstance.getClienteById.bind(clienteServiceInstance),
    createCliente: clienteServiceInstance.createCliente.bind(clienteServiceInstance),
    updateCliente: clienteServiceInstance.updateCliente.bind(clienteServiceInstance),
    deleteCliente: clienteServiceInstance.deleteCliente.bind(clienteServiceInstance),
};
//# sourceMappingURL=clienteService.js.map