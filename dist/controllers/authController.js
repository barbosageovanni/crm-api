"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator"); // Para usar com as validações de rota
const authService_1 = require("../services/authService"); // Importa a instância do AuthService
const AppError_1 = require("../errors/AppError"); // Usaremos para os erros de validação
const logger_1 = require("../utils/logger");
/**
 * Lida com o registro de um novo usuário.
 */
const register = async (req, res, next) => {
    // Validação de entrada (será definida nas rotas com express-validator)
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        // Se houver erros de validação do express-validator, cria um ValidationError
        logger_1.logger.warn('Falha na validação ao registrar usuário', { errors: errors.array() });
        return next(new AppError_1.ValidationError(errors.array(), 'Dados de registro inválidos.'));
    }
    // Extrai os dados validados do corpo da requisição
    // matchedData() retorna apenas os campos que passaram na validação
    const registerData = (0, express_validator_1.matchedData)(req);
    try {
        const userProfile = await authService_1.authService.register(registerData);
        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            user: userProfile,
        });
    }
    catch (error) {
        // Encaminha o erro para o middleware de tratamento de erros global
        next(error);
    }
};
exports.register = register;
/**
 * Lida com o login de um usuário existente.
 */
const login = async (req, res, next) => {
    // Validação de entrada (será definida nas rotas com express-validator)
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        logger_1.logger.warn('Falha na validação ao tentar fazer login', { errors: errors.array() });
        return next(new AppError_1.ValidationError(errors.array(), 'Dados de login inválidos.'));
    }
    const loginData = (0, express_validator_1.matchedData)(req);
    try {
        const authResponse = await authService_1.authService.login(loginData);
        res.status(200).json({
            message: 'Login bem-sucedido!',
            ...authResponse, // Inclui user e token
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// Futuramente, você pode adicionar outros métodos aqui, como:
// - forgotPassword
// - resetPassword
// - refreshToken
// - logout (embora o logout com JWT seja geralmente tratado no frontend invalidando o token)
//# sourceMappingURL=authController.js.map