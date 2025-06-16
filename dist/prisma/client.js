"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/prisma/client.ts
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger"); // Supondo que seu logger Winston está aqui
const prisma = new client_1.PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
    ],
});
prisma.$on('query', (e) => {
    logger_1.logger.debug('Prisma Query:', { duration: e.duration, query: e.query, params: e.params });
});
prisma.$on('info', (e) => {
    logger_1.logger.info('Prisma Info:', { message: e.message, target: e.target });
});
prisma.$on('warn', (e) => {
    logger_1.logger.warn('Prisma Warn:', { message: e.message, target: e.target });
});
prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma Error:', { message: e.message, target: e.target });
});
exports.default = prisma;
//# sourceMappingURL=client.js.map