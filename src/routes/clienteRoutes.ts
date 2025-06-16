// src/routes/clienteRoutes.ts - VERSÃO FINAL ORQUESTRADA

import { Router } from 'express';
import * as clienteController from '../controllers/clienteController';
import { 
    validateCreateCliente, 
    validateUpdateCliente, 
    validateListClientes,
    validateIdParam
} from '../middlewares/clienteValidator';
import { handleValidationErrors } from '../middlewares/validationErrorHandler';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Aplica autenticação para todas as rotas de clientes
router.use(authMiddleware);

// Definição das Rotas com orquestração clara
router.get(
    '/',
    validateListClientes,   // 1. Valida os parâmetros da query
    handleValidationErrors, // 2. Trata erros de validação
    clienteController.list  // 3. Executa o controller
);

router.get(
    '/:id',
    validateIdParam,
    handleValidationErrors,
    clienteController.show
);

router.post(
  '/',
  validateCreateCliente,
  handleValidationErrors,
  clienteController.create
);

router.put(
  '/:id',
  validateIdParam,          // Valida o ID na rota
  validateUpdateCliente,    // Valida o corpo da requisição
  handleValidationErrors,
  clienteController.update
);

router.delete(
    '/:id',
    validateIdParam,
    handleValidationErrors,
    clienteController.remove
);

export default router;