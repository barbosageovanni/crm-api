"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertMiddleware = exports.metrics = exports.healthCheck = void 0;
const client_1 = __importDefault(require("../prisma/client")); // Assumindo que este é o seu cliente Prisma global
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
// Limiares de memória configuráveis via variáveis de ambiente
const MEMORY_CRITICAL_THRESHOLD_PERCENT = parseInt(process.env.MEMORY_CRITICAL_THRESHOLD_PERCENT || '90');
const MEMORY_WARNING_THRESHOLD_PERCENT = parseInt(process.env.MEMORY_WARNING_THRESHOLD_PERCENT || '70');
const healthCheck = async (req, res) => {
    const startTime = Date.now();
    try {
        const dbHealth = await checkDatabaseHealth();
        const redisHealth = await checkRedisHealth();
        const memoryHealth = checkMemoryHealth();
        const overallStatus = determineOverallStatus(dbHealth, redisHealth, memoryHealth);
        const healthStatus = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.APP_VERSION || process.env.npm_package_version || '1.0.0', // Usar APP_VERSION se definido
            services: {
                database: dbHealth,
                redis: redisHealth,
                memory: memoryHealth
            }
        };
        const statusCode = overallStatus === 'unhealthy' ? 503 : 200; // Unhealthy -> 503, Degraded/Healthy -> 200
        logger_1.logger.info('Health check executado', {
            status: overallStatus,
            durationMs: Date.now() - startTime,
            services: {
                database: dbHealth.status,
                redis: redisHealth.status,
                memory: memoryHealth.status
            }
        });
        res.status(statusCode).json(healthStatus);
    }
    catch (error) {
        const err = error;
        logger_1.logger.error('Erro crítico no health check', { message: err.message, stack: err.stack });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check falhou devido a um erro interno.',
            details: err.message,
            uptime: process.uptime()
        });
    }
};
exports.healthCheck = healthCheck;
async function checkDatabaseHealth() {
    const start = Date.now();
    try {
        await client_1.default.$queryRaw `SELECT 1`; // Comando simples para verificar a conexão
        return {
            status: 'healthy',
            responseTime: Date.now() - start
        };
    }
    catch (error) {
        const err = error;
        logger_1.logger.error('Falha na verificação de saúde do banco de dados', { message: err.message });
        return {
            status: 'unhealthy',
            error: err.message,
            responseTime: Date.now() - start
        };
    }
}
async function checkRedisHealth() {
    const start = Date.now();
    try {
        if (!redis_1.redisService.isHealthy()) { // Verifica o status da conexão interna do redisService
            logger_1.logger.warn('Verificação de saúde do Redis: cliente não conectado inicialmente.');
            return {
                status: 'unhealthy',
                error: 'Redis não conectado (verificação inicial)'
            };
        }
        // Realiza um PING para garantir que o servidor Redis está respondendo
        // O ioredis pode ter um método ping() ou você pode usar set/get como antes
        // Supondo que seu redisService.client é uma instância ioredis
        // await redisService.getClient().ping(); // Se você expor getClient() em redisService
        // Ou continue com set/get se preferir:
        await redis_1.redisService.set('health_check_ping', 'pong', 10); // TTL curto
        const pong = await redis_1.redisService.get('health_check_ping');
        if (pong !== 'pong') {
            throw new Error('Falha no comando PING/PONG do Redis (valor retornado não esperado).');
        }
        return {
            status: 'healthy',
            responseTime: Date.now() - start
        };
    }
    catch (error) {
        const err = error;
        logger_1.logger.error('Falha na verificação de saúde do Redis', { message: err.message });
        return {
            status: 'unhealthy',
            error: err.message,
            responseTime: Date.now() - start
        };
    }
}
function checkMemoryHealth() {
    const memUsage = process.memoryUsage();
    // rss (Resident Set Size) é frequentemente mais representativo da memória total usada pelo processo
    const usedMemory = memUsage.rss;
    const totalMemory = require('os').totalmem(); // Memória total do sistema operacional
    // Para heap:
    // const usedHeap = memUsage.heapUsed;
    // const totalHeap = memUsage.heapTotal;
    // Usaremos RSS como uma métrica geral do processo. Para heap especificamente, use heapUsed/heapTotal.
    const percentage = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0; // % do total do sistema
    // Ou, para % do heap alocado:
    // const heapPercentage = memUsage.heapTotal > 0 ? (memUsage.heapUsed / memUsage.heapTotal) * 100 : 0;
    let status = 'healthy';
    // Basearemos o status no uso de heap, que é mais controlável pela aplicação Node.js
    const currentHeapPercentage = memUsage.heapTotal > 0 ? (memUsage.heapUsed / memUsage.heapTotal) * 100 : 0;
    if (currentHeapPercentage >= MEMORY_CRITICAL_THRESHOLD_PERCENT) {
        status = 'critical';
    }
    else if (currentHeapPercentage >= MEMORY_WARNING_THRESHOLD_PERCENT) {
        status = 'warning';
    }
    return {
        status,
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // Heap usado em MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // Heap total em MB
        percentage: Math.round(currentHeapPercentage) // % do heap usado
    };
}
function determineOverallStatus(db, redis, memory) {
    if (db.status === 'unhealthy') {
        return 'unhealthy'; // DB é crítico
    }
    if (redis.status === 'unhealthy' || memory.status === 'critical') {
        return 'degraded'; // Redis não saudável ou memória crítica torna o sistema degradado
    }
    if (memory.status === 'warning') {
        return 'degraded'; // Memória em alerta também é degradado
    }
    return 'healthy';
}
// Endpoint para métricas básicas (formato Prometheus-like)
// Para métricas mais avançadas e melhor compatibilidade com Prometheus,
// considere usar uma biblioteca como 'prom-client'.
// npm install prom-client
// Exemplo com prom-client:
// import client from 'prom-client';
// const register = new client.Registry();
// client.collectDefaultMetrics({ register });
// export const metrics = async (req: Request, res: Response) => {
//   res.set('Content-Type', register.contentType);
//   res.end(await register.metrics());
// }
const metrics = async (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage(); // Retorna em microssegundos
        const metricsText = `
# HELP nodejs_heap_space_size_used_bytes Process heap space size used from Node.js in bytes.
# TYPE nodejs_heap_space_size_used_bytes gauge
nodejs_heap_space_size_used_bytes ${memUsage.heapUsed}

# HELP nodejs_heap_space_size_total_bytes Process heap space size total from Node.js in bytes.
# TYPE nodejs_heap_space_size_total_bytes gauge
nodejs_heap_space_size_total_bytes ${memUsage.heapTotal}

# HELP nodejs_rss_bytes Process resident set size from Node.js in bytes.
# TYPE nodejs_rss_bytes gauge
nodejs_rss_bytes ${memUsage.rss}

# HELP process_uptime_seconds Process uptime in seconds.
# TYPE process_uptime_seconds counter
process_uptime_seconds ${process.uptime()}

# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total ${cpuUsage.user / 1000000}

# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.
# TYPE process_cpu_system_seconds_total counter
process_cpu_system_seconds_total ${cpuUsage.system / 1000000}
`.trim();
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metricsText);
    }
    catch (error) {
        const err = error;
        logger_1.logger.error('Erro ao gerar métricas', { message: err.message });
        res.status(500).send(`# Error generating metrics: ${err.message}`);
    }
};
exports.metrics = metrics;
// Middleware para alertas automáticos
const alertMiddleware = (req, res, next) => {
    const originalSend = res.send;
    const requestStartTime = Date.now();
    res.send = function (chunk) {
        const durationMs = Date.now() - requestStartTime;
        if (res.statusCode >= 500) {
            logger_1.logger.error('Erro Servidor (>=500) detectado', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                ip: req.ip, // Certifique-se que 'trust proxy' está configurado no Express se necessário
                userAgent: req.get('User-Agent'),
                durationMs: durationMs,
                // Não logar 'chunk' (body da resposta) por padrão, pode conter dados sensíveis
                // ou ser muito grande. Se necessário, logar seletivamente ou um resumo.
            });
        }
        else if (res.statusCode >= 400) {
            logger_1.logger.warn('Erro Cliente (>=400) detectado', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                durationMs: durationMs,
            });
        }
        return originalSend.call(this, chunk);
    };
    next();
};
exports.alertMiddleware = alertMiddleware;
//# sourceMappingURL=healthController.js.map