// src/prisma/client.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger'; // Supondo que seu logger Winston está aqui

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  logger.debug('Prisma Query:', { duration: e.duration, query: e.query, params: e.params });
});
prisma.$on('info', (e) => {
  logger.info('Prisma Info:', { message: e.message, target: e.target });
});
prisma.$on('warn', (e) => {
  logger.warn('Prisma Warn:', { message: e.message, target: e.target });
});
prisma.$on('error', (e) => {
  logger.error('Prisma Error:', { message: e.message, target: e.target });
});

export default prisma;