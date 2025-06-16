"use strict";
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
// src/routes/authRoutes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController = __importStar(require("../controllers/authController"));
const client_1 = require("@prisma/client"); // Importe o enum para validar o campo 'papel'
const router = (0, express_1.Router)();
// Validações para a rota de Registro
const registerValidationRules = [
    (0, express_validator_1.body)('nome')
        .trim()
        .notEmpty().withMessage('O nome é obrigatório.')
        .isLength({ min: 3 }).withMessage('O nome deve ter pelo menos 3 caracteres.'),
    (0, express_validator_1.body)('email')
        .isEmail().withMessage('Forneça um email válido.')
        .normalizeEmail(),
    (0, express_validator_1.body)('senha')
        .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres.'),
    (0, express_validator_1.body)('papel')
        .isIn(Object.values(client_1.PapelUsuario)) // Garante que o papel seja um dos valores do enum PapelUsuario
        .withMessage(`Papel inválido. Valores permitidos: ${Object.values(client_1.PapelUsuario).join(', ')}.`)
];
// Validações para a rota de Login
const loginValidationRules = [
    (0, express_validator_1.body)('email')
        .isEmail().withMessage('Forneça um email válido.')
        .normalizeEmail(),
    (0, express_validator_1.body)('senha')
        .notEmpty().withMessage('A senha é obrigatória.'),
];
// Definição das Rotas
router.post('/register', registerValidationRules, authController.register);
router.post('/login', loginValidationRules, authController.login);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map