"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../middlewares/AppError");
const logger_1 = require("../utils/logger");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    logger_1.logger.error('FATAL ERROR: JWT_SECRET não está definido nas variáveis de ambiente. A aplicação será encerrada.');
    process.exit(1);
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN
    ? parseInt(process.env.JWT_EXPIRES_IN, 10)
    : 3600;
if (isNaN(JWT_EXPIRES_IN)) {
    logger_1.logger.warn(`Valor inválido para JWT_EXPIRES_IN: "${process.env.JWT_EXPIRES_IN}". Usando fallback de 1 hora.`);
}
const JWT_SECRET_KEY = JWT_SECRET;
class AuthService {
    prisma;
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
            throw new AppError_1.AppError('Todos os campos (nome, email, senha, papel) são obrigatórios para registro.', 400);
        }
        const existingUser = await this.prisma.usuario.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new AppError_1.AppError('Email já está em uso.', 409);
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const senhaHash = await bcryptjs_1.default.hash(senha, salt);
        try {
            const newUser = await this.prisma.usuario.create({
                data: { nome, email, senhaHash, papel, ativo: true },
            });
            logger_1.logger.info('Novo usuário registrado', { userId: newUser.id, email: newUser.email });
            return this.toPublicProfile(newUser);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Erro ao criar usuário no banco de dados', { originalError: err, email });
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new AppError_1.AppError('Email já está em uso.', 409);
            }
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError(`Erro interno ao registrar usuário: ${err.message}`, 500);
        }
    }
    async login(data) {
        const { email, senha } = data;
        if (!email || !senha) {
            logger_1.logger.warn('Login attempt: Email or password missing', { email });
            throw new AppError_1.AppError('Email e senha são obrigatórios.', 400);
        }
        logger_1.logger.info('Login attempt: Searching for user', { email });
        const user = await this.prisma.usuario.findUnique({ where: { email } });
        if (!user) {
            logger_1.logger.warn('Login attempt failed: User not found', { email });
            throw new AppError_1.AppError('Credenciais inválidas.', 401);
        }
        if (!user.ativo) {
            logger_1.logger.warn('Login attempt failed: User inactive', { email });
            throw new AppError_1.AppError('Credenciais inválidas.', 401);
        }
        logger_1.logger.info('Login attempt: Comparing passwords', { email });
        const isMatch = await bcryptjs_1.default.compare(senha, user.senhaHash);
        if (!isMatch) {
            logger_1.logger.warn('Login attempt failed: Incorrect password', { email });
            throw new AppError_1.AppError('Credenciais inválidas.', 401);
        }
        logger_1.logger.info('Login attempt: Generating token payload', { email });
        const payload = { userId: user.id, email: user.email, papel: user.papel };
        const tokenOptions = { expiresIn: JWT_EXPIRES_IN };
        try {
            logger_1.logger.info('Login attempt: Signing JWT token', { email });
            const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET_KEY, tokenOptions);
            logger_1.logger.info('User logged in successfully', { userId: user.id });
            return {
                user: this.toPublicProfile(user),
                token,
            };
        }
        catch (jwtError) {
            const err = jwtError instanceof Error ? jwtError : new Error(String(jwtError));
            logger_1.logger.error('Error during JWT token generation', { email, error: err.message, stack: err.stack });
            throw new AppError_1.AppError('Erro interno do servidor ao gerar token de autenticação.', 500);
        }
    }
    async getUserProfile(id) {
        const user = await this.prisma.usuario.findUnique({
            where: { id },
        });
        if (!user || !user.ativo) {
            throw new AppError_1.AppError(`Usuário com ID ${id} não encontrado`, 404, 'NOT_FOUND');
        }
        return this.toPublicProfile(user);
    }
}
const client_2 = __importDefault(require("../prisma/client"));
const authServiceInstance = new AuthService(client_2.default);
exports.authService = {
    register: authServiceInstance.register.bind(authServiceInstance),
    login: authServiceInstance.login.bind(authServiceInstance),
    getUserProfile: authServiceInstance.getUserProfile.bind(authServiceInstance),
};
//# sourceMappingURL=authService.js.map