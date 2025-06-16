"use strict";
// src/routes/clienteRoutes.ts - Versão com Autenticação
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
const controller = __importStar(require("../controllers/clienteController"));
const clienteValidator_1 = require("../middlewares/clienteValidator"); // Seus middlewares de validação
const authMiddleware_1 = require("../middlewares/authMiddleware"); // 1. Importe o middleware de autenticação
const router = (0, express_1.Router)();
// 2. Aplica o middleware de autenticação a TODAS as rotas definidas abaixo neste arquivo.
// Qualquer requisição para /clientes, /clientes/:id, etc., passará primeiro pelo authMiddleware.
router.use(authMiddleware_1.authMiddleware);
// Definição das Rotas (agora protegidas)
router.get('/', controller.list);
router.get('/:id', controller.show);
router.post('/', clienteValidator_1.validateCreateCliente, // Primeiro valida os dados
clienteValidator_1.handleValidationErrors, // Depois lida com os erros de validação
controller.create // Só então executa o controller se tudo estiver ok
);
router.put('/:id', clienteValidator_1.validateUpdateCliente, clienteValidator_1.handleValidationErrors, controller.update);
router.delete('/:id', controller.remove);
exports.default = router;
//# sourceMappingURL=clienteRoutes.js.map