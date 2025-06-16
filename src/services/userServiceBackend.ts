// src/services/userServiceBackend.ts
import { PrismaClient, PapelUsuario as PrismaPapelUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/AppError';
import type {
  UserDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserFilterParams,
  UserPaginatedResponse,
  PapelUsuario
} from '../dtos/userDtos'; // Importando do arquivo de DTOs do backend

const prisma = new PrismaClient();

// Função auxiliar para converter o usuário do Prisma para o formato DTO
const convertToUserDTO = (user: any): UserDTO => {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    papel: user.papel as PapelUsuario,
    ativo: user.ativo,
    createdAt: user.createdAt.toISOString(), // Convertendo Date para string
    updatedAt: user.updatedAt.toISOString()  // Convertendo Date para string
  };
};

export const userServiceBackend = {
  async getUsers(params: UserFilterParams): Promise<UserPaginatedResponse> {
    const { page = 1, limit = 10, nome, email, papel, ativo } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (nome) where.nome = { contains: nome, mode: 'insensitive' };
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (papel) where.papel = papel;
    if (ativo !== undefined) where.ativo = ativo;

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
    } catch (error) {
      console.error("Erro ao buscar usuários no backend:", error);
      throw new AppError('Erro ao buscar usuários.', 500);
    }
  },

  async getUserById(id: number): Promise<UserDTO | null> {
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
        throw new AppError('Usuário não encontrado.', 404);
      }
      return convertToUserDTO(user); // Convertendo para o formato DTO
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`Erro ao buscar usuário ${id} no backend:`, error);
      throw new AppError('Erro ao buscar usuário.', 500);
    }
  },

  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    const { nome, email, senha, papel, ativo } = data;

    try {
      const existingUser = await prisma.usuario.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError('Email já cadastrado.', 409); // 409 Conflict
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      // Convertendo o papel para o enum do Prisma
      const papelEnum = papel as PrismaPapelUsuario || PrismaPapelUsuario.USUARIO;

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
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao criar usuário no backend:", error);
      throw new AppError('Erro ao criar usuário.', 500);
    }
  },

  async updateUser(id: number, data: UpdateUserDTO): Promise<UserDTO> {
    const { nome, email, papel, ativo } = data;

    try {
      // Verificar se o usuário existe
      const existingUser = await prisma.usuario.findUnique({ where: { id } });
      if (!existingUser) {
        throw new AppError('Usuário não encontrado.', 404);
      }

      // Verificar se o novo email já está em uso por outro usuário
      if (email && email !== existingUser.email) {
        const userWithEmail = await prisma.usuario.findUnique({ where: { email } });
        if (userWithEmail) {
          throw new AppError('Email já cadastrado por outro usuário.', 409);
        }
      }

      const updatedUser = await prisma.usuario.update({
        where: { id },
        data: {
          nome,
          email,
          papel: papel as PrismaPapelUsuario, // Convertendo para o enum do Prisma
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
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`Erro ao atualizar usuário ${id} no backend:`, error);
      throw new AppError('Erro ao atualizar usuário.', 500);
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      const user = await prisma.usuario.findUnique({ where: { id } });
      if (!user) {
        throw new AppError('Usuário não encontrado.', 404);
      }
      await prisma.usuario.delete({ where: { id } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`Erro ao deletar usuário ${id} no backend:`, error);
      throw new AppError('Erro ao deletar usuário.', 500);
    }
  },
  
  // Adicionar método para reset de senha se necessário
  async resetPassword(id: number, novaSenha: string): Promise<void> {
    try {
      const user = await prisma.usuario.findUnique({ where: { id } });
      if (!user) {
        throw new AppError('Usuário não encontrado.', 404);
      }
      const senhaHash = await bcrypt.hash(novaSenha, 10);
      await prisma.usuario.update({
        where: { id },
        data: { senhaHash },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`Erro ao resetar senha do usuário ${id}:`, error);
      throw new AppError('Erro ao resetar senha.', 500);
    }
  },
};
