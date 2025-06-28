"use strict";
// src/routes/transporteRoutes.ts - VERSÃO CORRIGIDA COM VALIDAÇÃO
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const transporteController_1 = require("../controllers/transporteController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = (0, express_1.Router)();
// --- Validações ---
// REVISÃO: Adicionada validação para os dados de entrada, baseado no DTO.
const createTransporteValidation = [
    (0, express_validator_1.body)('clienteId').isInt({ min: 1 }).withMessage('ID do cliente é obrigatório e deve ser um número.'),
    (0, express_validator_1.body)('numeroCteOc').trim().notEmpty().withMessage('O número CT-e/OC é obrigatório.'),
    (0, express_validator_1.body)('dataOperacao').isISO8601().toDate().withMessage('Data da operação inválida.'),
    (0, express_validator_1.body)('valorTotal').isFloat({ gt: 0 }).withMessage('Valor total deve ser um número positivo.'),
    (0, express_validator_1.body)('placaVeiculo').optional().isString(),
    (0, express_validator_1.body)('dataVencimento').optional().isISO8601().toDate(),
    (0, express_validator_1.body)('status').optional().isString(),
];
const updateTransporteValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID do transporte é inválido.'),
    (0, express_validator_1.body)('numeroCteOc').optional().trim().notEmpty(),
    (0, express_validator_1.body)('dataOperacao').optional().isISO8601().toDate(),
    (0, express_validator_1.body)('valorTotal').optional().isFloat({ gt: 0 }),
    // Adicione outras regras opcionais conforme necessário
];
// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware_1.authenticateToken);
// --- Rotas CRUD com Validação ---
router.get('/', transporteController_1.getTransportes);
router.get('/:id', (0, express_validator_1.param)('id').isInt({ min: 1 }), validationMiddleware_1.handleValidationErrors, transporteController_1.getTransporteById);
router.post('/', createTransporteValidation, validationMiddleware_1.handleValidationErrors, transporteController_1.createTransporte);
router.put('/:id', updateTransporteValidation, validationMiddleware_1.handleValidationErrors, transporteController_1.updateTransporte);
router.delete('/:id', (0, express_validator_1.param)('id').isInt({ min: 1 }), validationMiddleware_1.handleValidationErrors, transporteController_1.deleteTransporte);
exports.default = router;
//# sourceMappingURL=transporteRoutes.js.map