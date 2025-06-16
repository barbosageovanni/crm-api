"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.CACHE_KEYS = exports.redisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
class RedisService {
    constructor() {
        this.isConnected = false;
        this.connectionAttempted = false;
        const options = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            db: parseInt(process.env.REDIS_DB || '0'),
            retryStrategy(times) {
                const maxAttempts = 5; // Reduzido de 20 para 5
                if (times > maxAttempts) {
                    logger_1.logger.error(`Redis: Limite de ${maxAttempts} tentativas de reconexão atingido. Desistindo.`);
                    return null;
                }
                // Delay progressivo: 500ms, 1s, 2s, 4s, 8s
                const delay = Math.min(times * 500, 8000);
                logger_1.logger.info(`Redis: Tentando reconectar (tentativa ${times}). Próxima tentativa em ${delay}ms.`);
                return delay;
            },
            enableReadyCheck: true,
            maxRetriesPerRequest: 2, // Reduzido de 3 para 2
            lazyConnect: true,
            // Adicionar timeout para evitar conexões que ficam pendentes
            connectTimeout: 10000, // 10 segundos
            commandTimeout: 5000, // 5 segundos por comando
            // Desabilitar ping automático durante reconexão
            enableAutoPipelining: false,
        };
        if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0) {
            options.password = process.env.REDIS_PASSWORD;
        }
        this.client = new ioredis_1.default(options);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.logger.info('Redis: Conexão TCP estabelecida. Aguardando prontidão...');
        });
        this.client.on('ready', () => {
            logger_1.logger.info('Redis: Cliente pronto para uso!');
            this.isConnected = true;
        });
        this.client.on('error', (error) => {
            // Não logar erros de conexão se ainda não tentamos conectar explicitamente
            if (!this.connectionAttempted && error.message.includes('ECONNREFUSED')) {
                logger_1.logger.debug('Redis: Conexão recusada (serviço pode estar indisponível)');
            }
            else {
                logger_1.logger.error('Redis: Erro na conexão', {
                    message: error.message,
                    code: error.code,
                    errno: error.errno
                });
            }
            this.isConnected = false;
        });
        this.client.on('close', () => {
            logger_1.logger.warn('Redis: Conexão fechada');
            this.isConnected = false;
        });
        this.client.on('reconnecting', (delay) => {
            logger_1.logger.info(`Redis: Tentando reconectar em ${delay}ms...`);
            this.isConnected = false;
        });
        this.client.on('end', () => {
            logger_1.logger.warn('Redis: Conexão terminada. Sem mais tentativas de reconexão.');
            this.isConnected = false;
        });
    }
    /**
     * Tenta estabelecer conexão com verificação prévia de disponibilidade
     */
    async connect() {
        this.connectionAttempted = true;
        if (this.client.status === 'ready') {
            logger_1.logger.info('Redis: Já conectado');
            this.isConnected = true;
            return;
        }
        if (this.client.status === 'connecting') {
            logger_1.logger.info('Redis: Conexão já em progresso');
            return;
        }
        try {
            logger_1.logger.info('Redis: Iniciando conexão...');
            // Timeout para a conexão inicial
            const connectPromise = this.client.connect();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na conexão Redis')), 15000));
            await Promise.race([connectPromise, timeoutPromise]);
            logger_1.logger.info('Redis: Conectado com sucesso!');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Redis: Falha na conexão inicial', {
                message: err.message,
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || '6379'
            });
            this.isConnected = false;
            throw err;
        }
    }
    /**
     * Conecta apenas se necessário e possível
     */
    async connectIfNeeded() {
        if (this.isHealthy()) {
            return true;
        }
        try {
            await this.connect();
            return true;
        }
        catch (error) {
            logger_1.logger.warn('Redis: Não foi possível conectar. Operações serão ignoradas.');
            return false;
        }
    }
    async get(key) {
        if (!(await this.connectIfNeeded())) {
            return null;
        }
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Redis: Erro ao buscar chave', { key, message: err.message });
            return null;
        }
    }
    async set(key, value, ttlSeconds = 300) {
        if (!(await this.connectIfNeeded())) {
            return false;
        }
        try {
            await this.client.setex(key, ttlSeconds, JSON.stringify(value));
            return true;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Redis: Erro ao definir chave', { key, message: err.message });
            return false;
        }
    }
    async del(patternOrKey) {
        if (!(await this.connectIfNeeded())) {
            return 0;
        }
        try {
            if (typeof patternOrKey === 'string' && patternOrKey.includes('*')) {
                const keys = await this.client.keys(patternOrKey);
                if (keys.length > 0) {
                    const count = await this.client.del(...keys);
                    logger_1.logger.info(`Redis: ${count} chaves deletadas (padrão: ${patternOrKey})`);
                    return count;
                }
                return 0;
            }
            else {
                const keysToDelete = Array.isArray(patternOrKey) ? patternOrKey : [patternOrKey];
                if (keysToDelete.length === 0)
                    return 0;
                const count = await this.client.del(...keysToDelete);
                logger_1.logger.info(`Redis: ${count} chaves deletadas`);
                return count;
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Redis: Erro ao deletar chaves', { patternOrKey, message: err.message });
            return 0;
        }
    }
    async flush() {
        if (!(await this.connectIfNeeded())) {
            return false;
        }
        try {
            await this.client.flushdb();
            logger_1.logger.info('Redis: Cache limpo com sucesso');
            return true;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Redis: Erro ao limpar cache', { message: err.message });
            return false;
        }
    }
    /**
     * Verifica se está saudável e pronto
     */
    isHealthy() {
        return this.isConnected && this.client.status === 'ready';
    }
    /**
     * Testa conectividade com ping
     */
    async ping() {
        try {
            if (!(await this.connectIfNeeded())) {
                return false;
            }
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis: Ping falhou', { error: error.message });
            return false;
        }
    }
    /**
     * Encerra conexão graciosamente
     */
    async disconnect() {
        if (this.client.status !== 'end') {
            try {
                await this.client.quit();
                logger_1.logger.info('Redis: Desconectado com sucesso');
            }
            catch (error) {
                logger_1.logger.error('Redis: Erro ao desconectar', { error: error.message });
                this.client.disconnect(false);
            }
            finally {
                this.isConnected = false;
            }
        }
    }
    /**
     * Informações de status para debug
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            clientStatus: this.client.status,
            isHealthy: this.isHealthy()
        };
    }
}
// Singleton instance
exports.redisService = new RedisService();
// Constantes de Cache
exports.CACHE_KEYS = {
    CLIENTE_LIST: 'cliente:list',
    CLIENTE_BY_ID: 'cliente:id',
    CLIENTE_STATS: 'cliente:stats',
};
exports.CACHE_TTL = {
    SHORT: 60, // 1 minuto
    MEDIUM: 5 * 60, // 5 minutos
    LONG: 30 * 60, // 30 minutos
    VERY_LONG: 60 * 60, // 1 hora
};
//# sourceMappingURL=redis.js.map