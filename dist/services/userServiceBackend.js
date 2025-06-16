"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userServiceBackend = void 0;
// src/services/userServiceBackend.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AppError_1 = require("../errors/AppError");
const prisma = new client_1.PrismaClient();
// Função auxiliar para converter o usuário do Prisma para o formato DTO
const convertToUserDTO = (user) => {
    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.papel,
        ativo: user.ativo,
        createdAt: user.createdAt.toISOString(), // Convertendo Date para string
        updatedAt: user.updatedAt.toISOString() // Convertendo Date para string
    };
};
exports.userServiceBackend = {
    async getUsers(params) {
        const { page = 1, limit = 10, nome, email, papel, ativo } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (nome)
            where.nome = { contains: nome, mode: 'insensitive' };
        if (email)
            where.email = { contains: email, mode: 'insensitive' };
        if (papel)
            where.papel = papel;
        if (ativo !== undefined)
            where.ativo = ativo;
        try {
            const [users, total] = await prisma.$transaction([
                prisma.usuario.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: {
                        nome: 'asc',
                    },
                    // Excluir a senha do retorno
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        papel: true,
                        ativo: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                }),
                prisma.usuario.count({ where }),
            ]);
            return {
                items: users.map(convertToUserDTO), // Convertendo cada usuário para o formato DTO
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            console.error("Erro ao buscar usuários no backend:", error);
            throw new AppError_1.AppError('Erro ao buscar usuários.', 500);
        }
    },
    async getUserById(id) {
        try {
            const user = await prisma.usuario.findUnique({
                where: { id },
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    papel: true,
                    ativo: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                throw new AppError_1.AppError('Usuário não encontrado.', 404);
            }
            return convertToUserDTO(user); // Convertendo para o formato DTO
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            console.error(`Erro ao buscar usuário ${id} no backend:`, error);
            throw new AppError_1.AppError('Erro ao buscar usuário.', 500);
        }
    },
    async createUser(data) {
        const { nome, email, senha, papel, ativo } = data;
        try {
            const existingUser = await prisma.usuario.findUnique({ where: { email } });
            if (existingUser) {
                throw new AppError_1.AppError('Email já cadastrado.', 409); // 409 Conflict
            }
            const senhaHash = await bcryptjs_1.default.hash(senha, 10);
            // Convertendo o papel para o enum do Prisma
            const papelEnum = papel || client_1.PapelUsuario.USUARIO;
            const newUser = await prisma.usuario.create({
                data: {
                    nome,
                    email,
                    senhaHash,
                    papel: papelEnum, // Usando o enum do Prisma
                    ativo: ativo !== undefined ? ativo : true, // Default to true
                },
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    papel: true,
                    ativo: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return convertToUserDTO(newUser); // Convertendo para o formato DTO
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            console.error("Erro ao criar usuário no backend:", error);
            throw new AppError_1.AppError('Erro ao criar usuário.', 500);
        }
    },
    async updateUser(id, data) {
        const { nome, email, papel, ativo } = data;
        try {
            // Verificar se o usuário existe
            const existingUser = await prisma.usuario.findUnique({ where: { id } });
            if (!existingUser) {
                throw new AppError_1.AppError('Usuário não encontrado.', 404);
            }
            // Verificar se o novo email já está em uso por outro usuário
            if (email && email !== existingUser.email) {
                const userWithEmail = await prisma.usuario.findUnique({ where: { email } });
                if (userWithEmail) {
                    throw new AppError_1.AppError('Email já cadastrado por outro usuário.', 409);
                }
            }
            const updatedUser = await prisma.usuario.update({
                where: { id },
                data: {
                    nome,
                    email,
                    papel: papel, // Convertendo para o enum do Prisma
                    ativo,
                },
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    papel: true,
                    ativo: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return convertToUserDTO(updatedUser); // Convertendo para o formato DTO
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            console.error(`Erro ao atualizar usuário ${id} no backend:`, error);
            throw new AppError_1.AppError('Erro ao atualizar usuário.', 500);
        }
    },
    async deleteUser(id) {
        try {
            const user = await prisma.usuario.findUnique({ where: { id } });
            if (!user) {
                throw new AppError_1.AppError('Usuário não encontrado.', 404);
            }
            await prisma.usuario.delete({ where: { id } });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            console.error(`Erro ao deletar usuário ${id} no backend:`, error);
            throw new AppError_1.AppError('Erro ao deletar usuário.', 500);
        }
    },
    // Adicionar método para reset de senha se necessário
    async resetPassword(id, novaSenha) {
        try {
            const user = await prisma.usuario.findUnique({ where: { id } });
            if (!user) {
                throw new AppError_1.AppError('Usuário não encontrado.', 404);
            }
            const senhaHash = await bcryptjs_1.default.hash(novaSenha, 10);
            await prisma.usuario.update({
                where: { id },
                data: { senhaHash },
            });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            console.error(`Erro ao resetar senha do usuário ${id}:`, error);
            throw new AppError_1.AppError('Erro ao resetar senha.', 500);
        }
    },
};
//# sourceMappingURL=userServiceBackend.js.map