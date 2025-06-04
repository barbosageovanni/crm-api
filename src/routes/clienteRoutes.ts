// src/routes/clienteRoutes.ts - Versão com Autenticação

import { Router } from 'express';
import * as controller from '../controllers/clienteController';
import { validateCreateCliente, validateUpdateCliente, handleValidationErrors } from '../middlewares/clienteValidator'; // Seus middlewares de validação
import { authMiddleware } from '../middlewares/authMiddleware'; // 1. Importe o middleware de autenticação

const router = Router();

// 2. Aplica o middleware de autenticação a TODAS as rotas definidas abaixo neste arquivo.
// Qualquer requisição para /clientes, /clientes/:id, etc., passará primeiro pelo authMiddleware.
router.use(authMiddleware);

// Definição das Rotas (agora protegidas)
router.get('/', controller.list);

router.get('/:id', controller.show);

router.post(
  '/',
  validateCreateCliente,  // Primeiro valida os dados
  handleValidationErrors, // Depois lida com os erros de validação
  controller.create       // Só então executa o controller se tudo estiver ok
);

router.put(
  '/:id',
  validateUpdateCliente,
  handleValidationErrors,
  controller.update
);

router.delete('/:id', controller.remove);

export default router;