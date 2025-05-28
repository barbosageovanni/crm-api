// routes/clienteRoutes.ts - Versão melhorada
import { Router } from 'express';
import * as controller from '../controllers/clienteController';
import { validateCreateCliente, validateUpdateCliente, handleValidationErrors } from '../middlewares/clienteValidator';

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.show);
router.post('/', validateCreateCliente, handleValidationErrors, controller.create);
router.put('/:id', validateUpdateCliente, handleValidationErrors, controller.update);
router.delete('/:id', controller.remove);

export default router;
