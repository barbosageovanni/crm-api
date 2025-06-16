// src/routes/userRoutes.ts - VERSÃO ATUALIZADA E SEGURA

import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { userController } from '../controllers/userController';
import { PapelUsuario } from '@prisma/client';
import { authMiddleware as authenticateToken } from '../middlewares/authMiddleware';
import { handleValidationErrors } from '../middlewares/validationErrorHandler';

const router = Router();

// --- Validações ---

const createUserValidation = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 3 }),
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
  body('papel').optional().isIn(Object.values(PapelUsuario)).withMessage('Papel inválido.'),
  body('ativo').optional().isBoolean(),
];

const updateUserValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido.'),
  body('nome').optional().trim().notEmpty().isLength({ min: 3 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('papel').optional().isIn(Object.values(PapelUsuario)),
  body('ativo').optional().isBoolean(),
];

const userIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido.'),
];

const resetPasswordValidation = [
    param('id').isInt({ min: 1 }).withMessage('ID inválido.'),
    body('novaSenha').isLength({ min: 6 }).withMessage('Nova senha precisa ter no mínimo 6 caracteres.'),
];

// --- Middlewares de Segurança ---

// Middleware de Autorização (Exemplo)
// Este middleware verifica se o papel do usuário autenticado está na lista de papéis permitidos.
const authorizeRoles = (roles: PapelUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Garante que o middleware de autenticação já rodou e req.user existe.
    if (!req.user || !roles.includes(req.user.papel)) {
      return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para este recurso.' });
    }
    next();
  };
};

// --- Rotas com Segurança e Validação Ativadas ---

// 1. Aplica o middleware de autenticação a TODAS as rotas de usuário abaixo.
router.use(authenticateToken);

// 2. Definição das Rotas com seus respectivos níveis de autorização.

// GET /users - Listar usuários (Protegido para ADMIN e GERENTE)
router.get(
  '/', 
  authorizeRoles([PapelUsuario.ADMIN, PapelUsuario.GERENTE]), 
  userController.getUsers
);

// GET /users/:id - Obter usuário por ID (Protegido para ADMIN e GERENTE)
router.get(
  '/:id',
  userIdValidation,
  handleValidationErrors,
  authorizeRoles([PapelUsuario.ADMIN, PapelUsuario.GERENTE]),
  userController.getUserById
);

// POST /users - Criar novo usuário (Protegido apenas para ADMIN)
router.post(
  '/', 
  authorizeRoles([PapelUsuario.ADMIN]),
  createUserValidation, 
  handleValidationErrors,
  userController.createUser
);

// PUT /users/:id - Atualizar usuário (Protegido apenas para ADMIN)
router.put(
  '/:id', 
  authorizeRoles([PapelUsuario.ADMIN]),
  updateUserValidation, 
  handleValidationErrors,
  userController.updateUser
);

// DELETE /users/:id - Excluir usuário (Protegido apenas para ADMIN)
router.delete(
  '/:id', 
  authorizeRoles([PapelUsuario.ADMIN]),
  userIdValidation,
  handleValidationErrors,
  userController.deleteUser
);

// POST /users/:id/reset-password - Resetar senha (Protegido apenas para ADMIN)
router.post(
  '/:id/reset-password', 
  authorizeRoles([PapelUsuario.ADMIN]),
  resetPasswordValidation,
  handleValidationErrors,
  userController.resetPassword
);

export default router;