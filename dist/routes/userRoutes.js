"use strict";
// src/routes/userRoutes.ts - VERSÃO ATUALIZADA E SEGURA
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const userController_1 = require("../controllers/userController");
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = (0, express_1.Router)();
// --- Validações ---
const createUserValidation = [
    (0, express_validator_1.body)('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 3 }),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
    (0, express_validator_1.body)('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
    (0, express_validator_1.body)('papel').optional().isIn(Object.values(client_1.PapelUsuario)).withMessage('Papel inválido.'),
    (0, express_validator_1.body)('ativo').optional().isBoolean(),
];
const updateUserValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID inválido.'),
    (0, express_validator_1.body)('nome').optional().trim().notEmpty().isLength({ min: 3 }),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail(),
    (0, express_validator_1.body)('papel').optional().isIn(Object.values(client_1.PapelUsuario)),
    (0, express_validator_1.body)('ativo').optional().isBoolean(),
];
const userIdValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID inválido.'),
];
const resetPasswordValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID inválido.'),
    (0, express_validator_1.body)('novaSenha').isLength({ min: 6 }).withMessage('Nova senha precisa ter no mínimo 6 caracteres.'),
];
// --- Middlewares de Segurança ---
// Middleware de Autorização (Exemplo)
// Este middleware verifica se o papel do usuário autenticado está na lista de papéis permitidos.
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        // Garante que o middleware de autenticação já rodou e req.user existe.
        if (!req.user || !roles.includes(req.user.papel)) {
            res.status(403).json({ message: 'Acesso negado. Você não tem permissão para este recurso.' });
            return;
        }
        next();
    };
};
// --- Rotas com Segurança e Validação Ativadas ---
// 1. Aplica o middleware de autenticação a TODAS as rotas de usuário abaixo.
router.use(authMiddleware_1.authenticateToken);
// 2. Definição das Rotas com seus respectivos níveis de autorização.
// GET /users - Listar usuários (Protegido para ADMIN e GERENTE)
router.get('/', authorizeRoles([client_1.PapelUsuario.ADMIN, client_1.PapelUsuario.GERENTE]), userController_1.userController.getUsers);
// GET /users/:id - Obter usuário por ID (Protegido para ADMIN e GERENTE)
router.get('/:id', userIdValidation, validationMiddleware_1.handleValidationErrors, authorizeRoles([client_1.PapelUsuario.ADMIN, client_1.PapelUsuario.GERENTE]), userController_1.userController.getUserById);
// POST /users - Criar novo usuário (Protegido apenas para ADMIN)
router.post('/', authorizeRoles([client_1.PapelUsuario.ADMIN]), createUserValidation, validationMiddleware_1.handleValidationErrors, userController_1.userController.createUser);
// PUT /users/:id - Atualizar usuário (Protegido apenas para ADMIN)
router.put('/:id', authorizeRoles([client_1.PapelUsuario.ADMIN]), updateUserValidation, validationMiddleware_1.handleValidationErrors, userController_1.userController.updateUser);
// DELETE /users/:id - Excluir usuário (Protegido apenas para ADMIN)
router.delete('/:id', authorizeRoles([client_1.PapelUsuario.ADMIN]), userIdValidation, validationMiddleware_1.handleValidationErrors, userController_1.userController.deleteUser);
// POST /users/:id/reset-password - Resetar senha (Protegido apenas para ADMIN)
router.post('/:id/reset-password', authorizeRoles([client_1.PapelUsuario.ADMIN]), resetPasswordValidation, validationMiddleware_1.handleValidationErrors, userController_1.userController.resetPassword);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map