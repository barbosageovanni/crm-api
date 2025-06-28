"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.updateProfile = exports.refreshToken = exports.verifyToken = exports.logout = exports.getProfile = exports.login = exports.register = exports.refreshTokenValidators = exports.updateProfileValidators = exports.changePasswordValidators = exports.resetPasswordValidators = exports.forgotPasswordValidators = exports.loginValidators = exports.registerValidators = void 0;
const express_validator_1 = require("express-validator");
const authService_1 = require("../services/authService");
const AppError_1 = require("../errors/AppError");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
// ============================================================================
// CONSTANTS & TYPES
// ============================================================================
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;
// ============================================================================
// VALIDATION HELPERS
// ============================================================================
const createPasswordValidator = (fieldName, isRequired = true) => {
    const validator = (0, express_validator_1.body)(fieldName);
    if (isRequired) {
        validator
            .notEmpty()
            .withMessage(`${fieldName} é obrigatório.`);
    }
    return validator
        .isLength({ min: 8, max: 128 })
        .withMessage(`${fieldName} deve ter entre 8 e 128 caracteres.`)
        .matches(PASSWORD_REGEX)
        .withMessage(`${fieldName} deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.`);
};
const createEmailValidator = (fieldName = 'email', isRequired = true) => {
    const validator = (0, express_validator_1.body)(fieldName).trim();
    if (isRequired) {
        validator
            .notEmpty()
            .withMessage('Email é obrigatório.');
    }
    return validator
        .isEmail()
        .withMessage('Email inválido.')
        .isLength({ max: 255 })
        .withMessage('Email muito longo.')
        .normalizeEmail();
};
// ============================================================================
// VALIDATORS
// ============================================================================
exports.registerValidators = [
    (0, express_validator_1.body)('nome')
        .trim()
        .notEmpty()
        .withMessage('Nome é obrigatório.')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres.')
        .matches(NAME_REGEX)
        .withMessage('Nome deve conter apenas letras, espaços, hífens e apostrofos.')
        .escape(),
    createEmailValidator(),
    createPasswordValidator('senha'),
    (0, express_validator_1.body)('papel')
        .notEmpty()
        .withMessage('Papel é obrigatório.')
        .isIn(Object.values(client_1.$Enums.PapelUsuario))
        .withMessage(`Papel deve ser um dos seguintes: ${Object.values(client_1.$Enums.PapelUsuario).join(', ')}.`),
    validationMiddleware_1.handleValidationErrors,
];
exports.loginValidators = [
    createEmailValidator(),
    (0, express_validator_1.body)('senha')
        .notEmpty()
        .withMessage('Senha é obrigatória.')
        .isLength({ min: 1, max: 128 })
        .withMessage('Senha inválida.'),
    validationMiddleware_1.handleValidationErrors,
];
exports.forgotPasswordValidators = [
    createEmailValidator(),
    validationMiddleware_1.handleValidationErrors,
];
exports.resetPasswordValidators = [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .withMessage('Token é obrigatório.')
        .isLength({ min: 10, max: 500 })
        .withMessage('Token inválido.')
        .isJWT()
        .withMessage('Token deve ter formato válido.'),
    createPasswordValidator('novaSenha'),
    validationMiddleware_1.handleValidationErrors,
];
exports.changePasswordValidators = [
    (0, express_validator_1.body)('senhaAtual')
        .notEmpty()
        .withMessage('Senha atual é obrigatória.')
        .isLength({ min: 1, max: 128 })
        .withMessage('Senha atual inválida.'),
    createPasswordValidator('novaSenha'),
    (0, express_validator_1.body)('novaSenha').custom((value, { req }) => {
        if (value === req.body.senhaAtual) {
            throw new Error('A nova senha deve ser diferente da senha atual.');
        }
        return true;
    }),
    validationMiddleware_1.handleValidationErrors,
];
exports.updateProfileValidators = [
    (0, express_validator_1.body)('nome')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres.')
        .matches(NAME_REGEX)
        .withMessage('Nome deve conter apenas letras, espaços, hífens e apostrofos.')
        .escape(),
    createEmailValidator('email', false),
    validationMiddleware_1.handleValidationErrors,
];
exports.refreshTokenValidators = [
    (0, express_validator_1.body)('refreshToken')
        .notEmpty()
        .withMessage('Refresh token é obrigatório.')
        .isJWT()
        .withMessage('Refresh token deve ter formato válido.'),
    validationMiddleware_1.handleValidationErrors,
];
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const getClientInfo = (req) => ({
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    timestamp: new Date().toISOString(),
});
const sanitizeError = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Erro desconhecido';
};
const extractUserId = (req) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new AppError_1.AppError('Token inválido ou ausente.', 401);
    }
    return userId;
};
// ============================================================================
// CONTROLLERS
// ============================================================================
const register = async (req, res, next) => {
    try {
        const registerData = (0, express_validator_1.matchedData)(req);
        const clientInfo = getClientInfo(req);
        logger_1.logger.info('Tentativa de registro de usuário', {
            email: registerData.email,
            papel: registerData.papel,
            ...clientInfo,
        });
        const userProfile = await authService_1.authService.register(registerData);
        logger_1.logger.info('Usuário registrado com sucesso', {
            userId: userProfile.id,
            email: userProfile.email,
            papel: userProfile.papel,
            ...clientInfo,
        });
        res.status(201).json({
            status: 'success',
            message: 'Usuário registrado com sucesso!',
            data: {
                user: userProfile,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erro no registro de usuário', {
            error: sanitizeError(error),
            email: req.body?.email,
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const loginData = (0, express_validator_1.matchedData)(req);
        const clientInfo = getClientInfo(req);
        logger_1.logger.info('Tentativa de login', {
            email: loginData.email,
            ...clientInfo,
        });
        const authResponse = await authService_1.authService.login(loginData);
        logger_1.logger.info('Login realizado com sucesso', {
            userId: authResponse.user.id,
            email: authResponse.user.email,
            ...clientInfo,
        });
        res.status(200).json({
            status: 'success',
            message: 'Login realizado com sucesso!',
            data: authResponse,
        });
    }
    catch (error) {
        logger_1.logger.warn('Falha no login', {
            error: sanitizeError(error),
            email: req.body?.email,
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.login = login;
const getProfile = async (req, res, next) => {
    try {
        const userId = extractUserId(req);
        const userProfile = await authService_1.authService.getUserProfile(userId);
        res.status(200).json({
            status: 'success',
            data: {
                user: userProfile,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter perfil do usuário', {
            error: sanitizeError(error),
            userId: req.user?.userId,
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.getProfile = getProfile;
const logout = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const clientInfo = getClientInfo(req);
        // Por enquanto, apenas fazemos o logout do lado cliente
        // TODO: Implementar blacklist de tokens no authService
        logger_1.logger.info('Logout realizado', {
            userId,
            ...clientInfo,
        });
        res.status(200).json({
            status: 'success',
            message: 'Logout realizado com sucesso.',
        });
    }
    catch (error) {
        logger_1.logger.error('Erro no logout', {
            error: sanitizeError(error),
            userId: req.user?.userId,
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.logout = logout;
const verifyToken = async (req, res, next) => {
    try {
        const userId = extractUserId(req);
        // Se chegou até aqui, o token é válido (passou pelo middleware de autenticação)
        res.status(200).json({
            status: 'success',
            message: 'Token válido.',
            data: {
                userId,
                valid: true,
            },
        });
    }
    catch (error) {
        logger_1.logger.warn('Token inválido ou expirado', {
            error: sanitizeError(error),
            userId: req.user?.userId,
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.verifyToken = verifyToken;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = (0, express_validator_1.matchedData)(req);
        const clientInfo = getClientInfo(req);
        // TODO: Implementar refresh token no authService
        logger_1.logger.warn('Refresh token não implementado', {
            token: token.substring(0, 10) + '...',
            ...clientInfo,
        });
        throw new AppError_1.AppError('Funcionalidade de refresh token não implementada ainda.', 501);
    }
    catch (error) {
        logger_1.logger.warn('Falha na renovação do token', {
            error: sanitizeError(error),
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.refreshToken = refreshToken;
const updateProfile = async (req, res, next) => {
    try {
        const userId = extractUserId(req);
        const updateData = (0, express_validator_1.matchedData)(req);
        if (Object.keys(updateData).length === 0) {
            throw new AppError_1.AppError('Nenhum campo para atualizar foi fornecido.', 400);
        }
        // TODO: Implementar updateProfile no authService
        logger_1.logger.warn('Update profile não implementado', {
            userId,
            changedFields: Object.keys(updateData),
            ...getClientInfo(req),
        });
        throw new AppError_1.AppError('Funcionalidade de atualização de perfil não implementada ainda.', 501);
    }
    catch (error) {
        logger_1.logger.error('Erro ao atualizar perfil', {
            error: sanitizeError(error),
            userId: req.user?.userId,
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        const userId = extractUserId(req);
        const { senhaAtual, novaSenha } = (0, express_validator_1.matchedData)(req);
        // TODO: Implementar changePassword no authService
        logger_1.logger.warn('Change password não implementado', {
            userId,
            ...getClientInfo(req),
        });
        throw new AppError_1.AppError('Funcionalidade de alteração de senha não implementada ainda.', 501);
    }
    catch (error) {
        logger_1.logger.warn('Falha na alteração de senha', {
            error: sanitizeError(error),
            userId: req.user?.userId,
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.changePassword = changePassword;
const forgotPassword = async (req, res, next) => {
    const clientInfo = getClientInfo(req);
    const standardResponse = {
        status: 'success',
        message: 'Se o email estiver registrado, você receberá instruções para redefinir sua senha.',
    };
    try {
        const { email } = (0, express_validator_1.matchedData)(req);
        logger_1.logger.info('Solicitação de recuperação de senha', {
            email,
            ...clientInfo,
        });
        // TODO: Implementar forgotPassword no authService
        logger_1.logger.warn('Forgot password não implementado', { email });
        // Por segurança, sempre retorna sucesso, mesmo sem implementar
        res.status(200).json(standardResponse);
    }
    catch (error) {
        logger_1.logger.error('Erro na recuperação de senha', {
            error: sanitizeError(error),
            email: req.body?.email,
            ...clientInfo,
        });
        res.status(200).json(standardResponse);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { token, novaSenha } = (0, express_validator_1.matchedData)(req);
        const clientInfo = getClientInfo(req);
        logger_1.logger.info('Tentativa de reset de senha', {
            tokenPrefix: token.substring(0, 10) + '...',
            ...clientInfo,
        });
        // TODO: Implementar resetPassword no authService
        logger_1.logger.warn('Reset password não implementado');
        throw new AppError_1.AppError('Funcionalidade de reset de senha não implementada ainda.', 501);
    }
    catch (error) {
        logger_1.logger.warn('Falha no reset de senha', {
            error: sanitizeError(error),
            ...getClientInfo(req),
        });
        next(error);
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map