"use strict";
// src/services/authService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../errors/AppError");
const logger_1 = require("../utils/logger");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    logger_1.logger.error('FATAL ERROR: JWT_SECRET não está definido.');
    process.exit(1);
}
// Aqui TS infere number corretamente:
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN
    ? Number.parseInt(process.env.JWT_EXPIRES_IN, 10)
    : 3600;
const JWT_SECRET_KEY = JWT_SECRET;
class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toPublicProfile(user) {
        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            papel: user.papel,
            ativo: user.ativo,
        };
    }
    async register(data) {
        const { nome, email, senha, papel } = data;
        if (!nome || !email || !senha || !papel) {
            throw new AppError_1.ValidationError([], 'Todos os campos (nome, email, senha, papel) são obrigatórios para registro.');
        }
        // TODO: Adicionar mais validações (formato de email, força da senha) no controller ou aqui.
        const existingUser = await this.prisma.usuario.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new AppError_1.DuplicateError('Email', email);
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const senhaHash = await bcryptjs_1.default.hash(senha, salt);
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
            logger_1.logger.info('Novo usuário registrado', { userId: newUser.id, email: newUser.email });
            return this.toPublicProfile(newUser);
        }
        catch (error) {
            logger_1.logger.error('Erro ao criar usuário no banco de dados durante o registro', { originalError: error, email });
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new AppError_1.DuplicateError('Email', email);
            }
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            let errorMessage = 'Não foi possível registrar o usuário devido a um erro interno.';
            if (error instanceof Error) {
                errorMessage = `Erro interno ao registrar usuário: ${error.message}`;
            }
            throw new AppError_1.AppError(errorMessage, 500);
        }
    }
    async login(data) {
        const { email, senha } = data;
        if (!email || !senha)
            throw new AppError_1.ValidationError([], 'Email e senha são obrigatórios.');
        const user = await this.prisma.usuario.findUnique({ where: { email } });
        if (!user)
            throw new AppError_1.AppError('Credenciais inválidas.', 401);
        if (!user.ativo)
            throw new AppError_1.AppError('Usuário inativo.', 403);
        const isMatch = await bcryptjs_1.default.compare(senha, user.senhaHash);
        if (!isMatch)
            throw new AppError_1.AppError('Credenciais inválidas.', 401);
        const payload = { userId: user.id, email: user.email, papel: user.papel };
        const tokenOptions = {
            expiresIn: JWT_EXPIRES_IN, // AGORA é number
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET_KEY, tokenOptions);
        logger_1.logger.info('Usuário logado com sucesso', { userId: user.id });
        return { user: this.toPublicProfile(user), token };
    }
}
const client_2 = __importDefault(require("../prisma/client"));
const serviceInstance = new AuthService(client_2.default); // AuthService é a classe
exports.authService = serviceInstance; // Exporta a instância
//# sourceMappingURL=authService.js.map