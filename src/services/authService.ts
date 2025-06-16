import { PrismaClient, Usuario, PapelUsuario, Prisma } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import {
  type RegisterUserDTO,
  type LoginUserDTO,
  type AuthResponseDTO,
  type UserPublicProfileDTO,
} from '../dtos/authDtos';
import { AppError, DuplicateError, NotFoundError, ValidationError } from '../middlewares/AppError';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('FATAL ERROR: JWT_SECRET não está definido nas variáveis de ambiente. A aplicação será encerrada.');
  process.exit(1);
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN
  ? parseInt(process.env.JWT_EXPIRES_IN, 10)
  : 3600;

if (isNaN(JWT_EXPIRES_IN)) {
    logger.warn(`Valor inválido para JWT_EXPIRES_IN: "${process.env.JWT_EXPIRES_IN}". Usando fallback de 1 hora.`);
}

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
        data: { nome, email, senhaHash, papel, ativo: true },
      });
      logger.info('Novo usuário registrado', { userId: newUser.id, email: newUser.email });
      return this.toPublicProfile(newUser);
    } catch (error: unknown) { 
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Erro ao criar usuário no banco de dados', { originalError: err, email });
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new DuplicateError('Email', email);
      }
      if (err instanceof AppError) throw err;
      throw new AppError(`Erro interno ao registrar usuário: ${err.message}`, 500);
    }
  }

  async login(data: LoginUserDTO): Promise<AuthResponseDTO> {
    const { email, senha } = data;
    if (!email || !senha) {
      logger.warn('Login attempt: Email or password missing', { email });
      throw new ValidationError([], 'Email e senha são obrigatórios.');
    }

    logger.info('Login attempt: Searching for user', { email });
    const user = await this.prisma.usuario.findUnique({ where: { email } });

    if (!user) {
        logger.warn('Login attempt failed: User not found', { email });
        throw new AppError('Credenciais inválidas.', 401);
    }
    if (!user.ativo) {
        logger.warn('Login attempt failed: User inactive', { email });
        throw new AppError('Credenciais inválidas.', 401);
    }

    logger.info('Login attempt: Comparing passwords', { email });
    const isMatch = await bcryptjs.compare(senha, user.senhaHash);
    if (!isMatch) {
      logger.warn('Login attempt failed: Incorrect password', { email });
      throw new AppError('Credenciais inválidas.', 401);
    }

    logger.info('Login attempt: Generating token payload', { email });
    const payload = { userId: user.id, email: user.email, papel: user.papel };
    const tokenOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };

    try {
      logger.info('Login attempt: Signing JWT token', { email });
      const token = jwt.sign(payload, JWT_SECRET_KEY, tokenOptions);
      logger.info('User logged in successfully', { userId: user.id });

      return {
        user: this.toPublicProfile(user),
        token,
      };
    } catch (jwtError: unknown) {
      const err = jwtError instanceof Error ? jwtError : new Error(String(jwtError));
      logger.error('Error during JWT token generation', { email, error: err.message, stack: err.stack });
      throw new AppError('Erro interno do servidor ao gerar token de autenticação.', 500);
    }
  }

  async getUserProfile(id: number): Promise<UserPublicProfileDTO> {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!user || !user.ativo) {
      throw new NotFoundError('Usuário', id);
    }

    return this.toPublicProfile(user);
  }
}

import prisma from '../prisma/client';
const authServiceInstance = new AuthService(prisma);

export const authService = {
  register: authServiceInstance.register.bind(authServiceInstance),
  login: authServiceInstance.login.bind(authServiceInstance),
  getUserProfile: authServiceInstance.getUserProfile.bind(authServiceInstance),
};


