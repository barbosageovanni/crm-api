// src/types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      PORT?: string;
      CORS_ORIGIN?: string;
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      REDIS_URL?: string;
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_PASSWORD?: string;
      DATABASE_URL?: string;
      DB_HOST?: string;
      DB_PORT?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;
      DB_NAME?: string;
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX?: string;
      LOG_LEVEL?: string;
      // Adicione outras variáveis de ambiente conforme necessário
    }
  }
}

export {};