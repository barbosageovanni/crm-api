"use strict";
// src/routes/clienteRoutes.ts - VERSÃO FINAL ORQUESTRADA
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clienteController = __importStar(require("../controllers/clienteController"));
const clienteValidator_1 = require("../middlewares/clienteValidator");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Aplica autenticação para todas as rotas de clientes
router.use(authMiddleware_1.authenticateToken);
// Definição das Rotas com orquestração clara
router.get('/', clienteValidator_1.validateListClientes, // 1. Valida os parâmetros da query
validationMiddleware_1.handleValidationErrors, // 2. Trata erros de validação
clienteController.list // 3. Executa o controller
);
router.get('/:id', clienteValidator_1.validateIdParam, validationMiddleware_1.handleValidationErrors, clienteController.show);
router.post('/', clienteValidator_1.validateCreateCliente, validationMiddleware_1.handleValidationErrors, clienteController.create);
router.put('/:id', clienteValidator_1.validateIdParam, // Valida o ID na rota
clienteValidator_1.validateUpdateCliente, // Valida o corpo da requisição
validationMiddleware_1.handleValidationErrors, clienteController.update);
router.delete('/:id', clienteValidator_1.validateIdParam, validationMiddleware_1.handleValidationErrors, clienteController.remove);
exports.default = router;
//# sourceMappingURL=clienteRoutes.js.map