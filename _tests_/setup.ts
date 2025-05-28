import { PrismaClient } from '@prisma/client';

// Mock do Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    cliente: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Mock do Redis
jest.mock('../src/config/redis', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flush: jest.fn(),
    isHealthy: jest.fn().mockReturnValue(true),
  },
  CACHE_KEYS: {
    CLIENTE_LIST: 'cliente:list',
    CLIENTE_BY_ID: 'cliente:id',
  },
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
  },
}));

// Mock do Logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
