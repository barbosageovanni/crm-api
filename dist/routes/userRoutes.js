"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userRoutes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const userController_1 = require("../controllers/userController");
const client_1 = require("@prisma/client");
// import { authenticateToken } from '../middlewares/authMiddleware'; // Descomente se tiver middleware de autenticação
// import { authorizeRoles } from '../middlewares/authorizationMiddleware'; // Descomente se tiver middleware de autorização
const router = (0, express_1.Router)();
// --- Validações --- 
// Validação para criação de usuário
const createUserValidation = [
    (0, express_validator_1.body)('nome').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ min: 3 }).withMessage('Nome precisa ter no mínimo 3 caracteres'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    (0, express_validator_1.body)('senha').isLength({ min: 6 }).withMessage('Senha precisa ter no mínimo 6 caracteres'),
    (0, express_validator_1.body)('papel').optional().isIn(Object.values(client_1.PapelUsuario)).withMessage('Papel inválido'),
    (0, express_validator_1.body)('ativo').optional().isBoolean().withMessage('Status ativo deve ser booleano'),
];
// Validação para atualização de usuário
const updateUserValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID inválido'),
    (0, express_validator_1.body)('nome').optional().trim().notEmpty().withMessage('Nome não pode ser vazio').isLength({ min: 3 }).withMessage('Nome precisa ter no mínimo 3 caracteres'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email inválido').normalizeEmail(),
    (0, express_validator_1.body)('papel').optional().isIn(Object.values(client_1.PapelUsuario)).withMessage('Papel inválido'),
    (0, express_validator_1.body)('ativo').optional().isBoolean().withMessage('Status ativo deve ser booleano'),
];
// Validação para ID de usuário
const userIdValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID inválido'),
];
// Validação para reset de senha
const resetPasswordValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID inválido'),
    (0, express_validator_1.body)('novaSenha').isLength({ min: 6 }).withMessage('Nova senha precisa ter no mínimo 6 caracteres'),
];
// --- Rotas --- 
// Aplicar middleware de autenticação a todas as rotas de usuário (ou individualmente)
// router.use(authenticateToken); // Descomente para exigir autenticação
// GET /users - Listar usuários (Protegido para ADMIN/GERENTE?)
router.get('/', 
// authorizeRoles(PapelUsuario.ADMIN, PapelUsuario.GERENTE), // Exemplo de autorização
userController_1.userController.getUsers);
// GET /users/:id - Obter usuário por ID (Protegido para ADMIN/GERENTE?)
router.get('/:id', userIdValidation, 
// authorizeRoles(PapelUsuario.ADMIN, PapelUsuario.GERENTE),
userController_1.userController.getUserById);
// POST /users - Criar novo usuário (Protegido para ADMIN?)
router.post('/', 
// authorizeRoles(PapelUsuario.ADMIN),
createUserValidation, userController_1.userController.createUser);
// PUT /users/:id - Atualizar usuário (Protegido para ADMIN?)
router.put('/:id', 
// authorizeRoles(PapelUsuario.ADMIN),
updateUserValidation, userController_1.userController.updateUser);
// DELETE /users/:id - Excluir usuário (Protegido para ADMIN?)
router.delete('/:id', 
// authorizeRoles(PapelUsuario.ADMIN),
userIdValidation, userController_1.userController.deleteUser);
// POST /users/reset-password/:id - Resetar senha (Protegido para ADMIN?)
// Ajuste a rota conforme necessário, pode ser PUT /users/:id/password etc.
router.post('/reset-password/:id', 
// authorizeRoles(PapelUsuario.ADMIN),
resetPasswordValidation, userController_1.userController.resetPassword);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map