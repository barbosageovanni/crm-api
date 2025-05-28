// src/config/redis.ts
import Redis from 'ioredis';
import { logger } from '../utils/logger';

class RedisService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis conectado');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Erro no Redis:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Conexão Redis fechada');
      this.isConnected = false;
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Erro ao buscar cache:', { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Erro ao salvar cache:', { key, error });
      return false;
    }
  }

  async del(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Erro ao deletar cache:', { pattern, error });
    }
  }

  async flush(): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.flushdb();
    } catch (error) {
      logger.error('Erro ao limpar cache:', error);
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

// Singleton instance
export const redisService = new RedisService();

// Cache keys e TTL constants
export const CACHE_KEYS = {
  CLIENTE_LIST: 'cliente:list',
  CLIENTE_BY_ID: 'cliente:id',
  CLIENTE_STATS: 'cliente:stats',
} as const;

export const CACHE_TTL = {
  SHORT: 60,      // 1 minuto
  MEDIUM: 300,    // 5 minutos
  LONG: 1800,     // 30 minutos
  VERY_LONG: 3600, // 1 hora
} as const;