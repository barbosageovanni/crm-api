"use strict";
// src/dtos/userDtos.ts - VERSÃO CORRIGIDA E CONSISTENTE
Object.defineProperty(exports, "__esModule", { value: true });
exports.PapelUsuario = void 0;
// REVISÃO: A fonte da verdade para PapelUsuario deve ser o enum gerado pelo Prisma.
// Isso evita inconsistências entre o que a aplicação acha que existe e o que o banco de dados impõe.
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "PapelUsuario", { enumerable: true, get: function () { return client_1.PapelUsuario; } });
//# sourceMappingURL=userDtos.js.map