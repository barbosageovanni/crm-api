import Redis, { RedisOptions } from 'ioredis'; // Certifique-se que "ioredis" está instalado (npm install ioredis)
import { logger } from '../utils/logger';

class RedisService {
  private client: Redis;
  private isConnected: boolean = false;
  private connectionAttempted: boolean = false;

  constructor() {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy(times: number): number | null {
        const maxAttempts = 5; // Reduzido de 20 para 5
        if (times > maxAttempts) {
          logger.error(`Redis: Limite de ${maxAttempts} tentativas de reconexão atingido. Desistindo.`);
          return null;
        }
        // Delay progressivo: 500ms, 1s, 2s, 4s, 8s
        const delay = Math.min(times * 500, 8000);
        logger.info(`Redis: Tentando reconectar (tentativa ${times}). Próxima tentativa em ${delay}ms.`);
        return delay;
      },
      enableReadyCheck: true,
      maxRetriesPerRequest: 2, // Reduzido de 3 para 2
      lazyConnect: true,
      // Adiciona timeout para evitar conexões pendentes
      connectTimeout: 10000, // 10 segundos
      commandTimeout: 5000,  // 5 segundos por comando
      // Desabilitar auto-pipelining durante reconexão
      enableAutoPipelining: false,
    };

    if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0) {
      options.password = process.env.REDIS_PASSWORD;
    }

    this.client = new Redis(options);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis: Conexão TCP estabelecida. Aguardando prontidão...');
    });

    this.client.on('ready', () => {
      logger.info('Redis: Cliente pronto para uso!');
      this.isConnected = true;
    });

    this.client.on('error', (error: Error) => {
      // Evitar logar erros de conexão se ainda não houve tentativa explícita
      if (!this.connectionAttempted && error.message.includes('ECONNREFUSED')) {
        logger.debug('Redis: Conexão recusada (serviço pode estar indisponível)');
      } else {
        logger.error('Redis: Erro na conexão', { 
          message: error.message, 
          code: (error as any).code,
          errno: (error as any).errno 
        });
      }
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis: Conexão fechada');
      this.isConnected = false;
    });

    this.client.on('reconnecting', (delay: number) => {
      logger.info(`Redis: Tentando reconectar em ${delay}ms...`);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis: Conexão terminada. Sem mais tentativas de reconexão.');
      this.isConnected = false;
    });
  }

  /**
   * Tenta estabelecer conexão com verificação prévia de disponibilidade
   */
  public async connect(): Promise<void> {
    this.connectionAttempted = true;

    if (this.client.status === 'ready') {
      logger.info('Redis: Já conectado');
      this.isConnected = true;
      return;
    }

    if (this.client.status === 'connecting') {
      logger.info('Redis: Conexão já em progresso');
      return;
    }

    try {
      logger.info('Redis: Iniciando conexão...');
      // Timeout para a conexão inicial
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na conexão Redis')), 15000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      logger.info('Redis: Conectado com sucesso!');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Redis: Falha na conexão inicial', { 
        message: err.message,
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || '5555'
      });
      this.isConnected = false;
      throw err;
    }
  }

  /**
   * Conecta apenas se necessário e possível
   */
  public async connectIfNeeded(): Promise<boolean> {
    if (this.isHealthy()) {
      return true;
    }
    try {
      await this.connect();
      return true;
    } catch (error) {
      logger.warn('Redis: Não foi possível conectar. Operações serão ignoradas.');
      return false;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!(await this.connectIfNeeded())) {
      return null;
    }
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) as T : null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Redis: Erro ao buscar chave', { key, message: err.message });
      return null;
    }
  }

  public async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!(await this.connectIfNeeded())) {
      return false;
    }
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Redis: Erro ao definir chave', { key, message: err.message });
      return false;
    }
  }

  public async del(patternOrKey: string | string[]): Promise<number> {
    if (!(await this.connectIfNeeded())) {
      return 0;
    }
    try {
      if (typeof patternOrKey === 'string' && patternOrKey.includes('*')) {
        const keys = await this.client.keys(patternOrKey);
        if (keys.length > 0) {
          const count = await this.client.del(...keys);
          logger.info(`Redis: ${count} chaves deletadas (padrão: ${patternOrKey})`);
          return count;
        }
        return 0;
      } else {
        const keysToDelete = Array.isArray(patternOrKey) ? patternOrKey : [patternOrKey];
        if (keysToDelete.length === 0) return 0;
        const count = await this.client.del(...keysToDelete);
        logger.info(`Redis: ${count} chaves deletadas`);
        return count;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Redis: Erro ao deletar chaves', { patternOrKey, message: err.message });
      return 0;
    }
  }

  public async flush(): Promise<boolean> {
    if (!(await this.connectIfNeeded())) {
      return false;
    }
    try {
      await this.client.flushdb();
      logger.info('Redis: Cache limpo com sucesso');
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Redis: Erro ao limpar cache', { message: err.message });
      return false;
    }
  }

  /**
   * Verifica se o cliente está saudável e pronto
   */
  public isHealthy(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  /**
   * Testa a conectividade com o comando ping
   */
  public async ping(): Promise<boolean> {
    try {
      if (!(await this.connectIfNeeded())) {
        return false;
      }
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis: Ping falhou', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Encerra a conexão de forma graciosa
   */
  public async disconnect(): Promise<void> {
    if (this.client.status !== 'end') {
      try {
        await this.client.quit();
        logger.info('Redis: Desconectado com sucesso');
      } catch (error) {
        logger.error('Redis: Erro ao desconectar', { error: (error as Error).message });
        this.client.disconnect(false);
      } finally {
        this.isConnected = false;
      }
    }
  }

  /**
   * Retorna informações de status para debug
   */
  public getStatus(): {
    isConnected: boolean;
    clientStatus: string;
    isHealthy: boolean;
  } {
    return {
      isConnected: this.isConnected,
      clientStatus: this.client.status,
      isHealthy: this.isHealthy()
    };
  }
}

// Singleton instance
export const redisService = new RedisService();

// Constantes de cache
export const CACHE_KEYS = {
  CLIENTE_LIST: 'cliente:list',
  CLIENTE_BY_ID: 'cliente:id',
  CLIENTE_STATS: 'cliente:stats',
} as const;

export const CACHE_TTL = {
  SHORT: 60,        // 1 minuto
  MEDIUM: 5 * 60,   // 5 minutos
  LONG: 30 * 60,    // 30 minutos
  VERY_LONG: 60 * 60, // 1 hora
} as const;