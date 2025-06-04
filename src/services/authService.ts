// src/services/authService.ts

import { PrismaClient, Usuario, Prisma } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import {
  RegisterUserDTO,
  LoginUserDTO,
  AuthResponseDTO,
  UserPublicProfileDTO,
} from '../dtos/authDtos';
import { AppError, DuplicateError, NotFoundError, ValidationError } from '../errors/AppError';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('FATAL ERROR: JWT_SECRET não está definido.');
  process.exit(1);
}

// Aqui TS infere number corretamente:
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN
  ? Number.parseInt(process.env.JWT_EXPIRES_IN, 10)
  : 3600;

const JWT_SECRET_KEY: Secret = JWT_SECRET;

class AuthService {
  constructor(private prisma: PrismaClient) {}

  private toPublicProfile(user: Usuario): UserPublicProfileDTO {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      papel: user.papel,
      ativo: user.ativo,
    };
  }

  async register(data: RegisterUserDTO): Promise<UserPublicProfileDTO> {
    const { nome, email, senha, papel } = data;

    if (!nome || !email || !senha || !papel) {
      throw new ValidationError([], 'Todos os campos (nome, email, senha, papel) são obrigatórios para registro.');
    }
    // TODO: Adicionar mais validações (formato de email, força da senha) no controller ou aqui.

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new DuplicateError('Email', email);
    }

    const salt = await bcryptjs.genSalt(10);
    const senhaHash = await bcryptjs.hash(senha, salt);

    try {
      const newUser = await this.prisma.usuario.create({
        data: {
          nome,
          email,
          senhaHash,
          papel,
          ativo: true,
        },
      });
      logger.info('Novo usuário registrado', { userId: newUser.id, email: newUser.email });
      return this.toPublicProfile(newUser);
    } catch (error: unknown) { 
      logger.error('Erro ao criar usuário no banco de dados durante o registro', { originalError: error, email });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateError('Email', email);
      }
      if (error instanceof AppError) {
        throw error;
      }
      
      let errorMessage = 'Não foi possível registrar o usuário devido a um erro interno.';
      if (error instanceof Error) { 
        errorMessage = `Erro interno ao registrar usuário: ${error.message}`;
      }
      throw new AppError(errorMessage, 500);
    }
  }

  async login(data: LoginUserDTO): Promise<AuthResponseDTO> {
    const { email, senha } = data;
    if (!email || !senha) throw new ValidationError([], 'Email e senha são obrigatórios.');

    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) throw new AppError('Credenciais inválidas.', 401);
    if (!user.ativo) throw new AppError('Usuário inativo.', 403);

    const isMatch = await bcryptjs.compare(senha, user.senhaHash);
    if (!isMatch) throw new AppError('Credenciais inválidas.', 401);

    const payload = { userId: user.id, email: user.email, papel: user.papel };

    const tokenOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN,  // AGORA é number
    };

    const token = jwt.sign(payload, JWT_SECRET_KEY, tokenOptions);
    logger.info('Usuário logado com sucesso', { userId: user.id });

    return { user: this.toPublicProfile(user), token };
  }
}

import prisma from '../prisma/client';
const serviceInstance = new AuthService(prisma); // AuthService é a classe
export const authService = serviceInstance; // Exporta a instância