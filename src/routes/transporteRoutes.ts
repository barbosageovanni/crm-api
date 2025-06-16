// src/routes/transporteRoutes.ts - VERSÃO CORRIGIDA COM VALIDAÇÃO

import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getTransportes,
  getTransporteById,
  createTransporte,
  updateTransporte,
  deleteTransporte
} from '../controllers/transporteController';
import { authMiddleware as authenticateToken } from '../middlewares/authMiddleware';
import { handleValidationErrors } from '../middlewares/validationErrorHandler'; // REVISÃO: Reutilize seu handler de erros

const router = Router();

// --- Validações ---
// REVISÃO: Adicionada validação para os dados de entrada, baseado no DTO.
const createTransporteValidation = [
  body('clienteId').isInt({ min: 1 }).withMessage('ID do cliente é obrigatório e deve ser um número.'),
  body('numeroCteOc').trim().notEmpty().withMessage('O número CT-e/OC é obrigatório.'),
  body('dataOperacao').isISO8601().toDate().withMessage('Data da operação inválida.'),
  body('valorTotal').isFloat({ gt: 0 }).withMessage('Valor total deve ser um número positivo.'),
  body('placaVeiculo').optional().isString(),
  body('dataVencimento').optional().isISO8601().toDate(),
  body('status').optional().isString(),
];

const updateTransporteValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID do transporte é inválido.'),
  body('numeroCteOc').optional().trim().notEmpty(),
  body('dataOperacao').optional().isISO8601().toDate(),
  body('valorTotal').optional().isFloat({ gt: 0 }),
  // Adicione outras regras opcionais conforme necessário
];

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// --- Rotas CRUD com Validação ---
router.get('/', getTransportes);
router.get('/:id', param('id').isInt({min: 1}), handleValidationErrors, getTransporteById);

router.post(
  '/', 
  createTransporteValidation, 
  handleValidationErrors, 
  createTransporte
);

router.put(
  '/:id', 
  updateTransporteValidation, 
  handleValidationErrors, 
  updateTransporte
);

router.delete(
  '/:id', 
  param('id').isInt({min: 1}), 
  handleValidationErrors, 
  deleteTransporte
);

export default router;