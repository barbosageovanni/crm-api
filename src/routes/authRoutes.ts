// src/routes/authRoutes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { PapelUsuario } from '@prisma/client'; // Importe o enum para validar o campo 'papel'

const router = Router();

// Validações para a rota de Registro
const registerValidationRules = [
  body('nome')
    .trim()
    .notEmpty().withMessage('O nome é obrigatório.')
    .isLength({ min: 3 }).withMessage('O nome deve ter pelo menos 3 caracteres.'),
  body('email')
    .isEmail().withMessage('Forneça um email válido.')
    .normalizeEmail(),
  body('senha')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres.'),
  body('papel')
    .isIn(Object.values(PapelUsuario)) // Garante que o papel seja um dos valores do enum PapelUsuario
    .withMessage(`Papel inválido. Valores permitidos: ${Object.values(PapelUsuario).join(', ')}.`)
];

// Validações para a rota de Login
const loginValidationRules = [
  body('email')
    .isEmail().withMessage('Forneça um email válido.')
    .normalizeEmail(),
  body('senha')
    .notEmpty().withMessage('A senha é obrigatória.'),
];

// Definição das Rotas
router.post('/register', registerValidationRules, authController.register);
router.post('/login', loginValidationRules, authController.login);

export default router;