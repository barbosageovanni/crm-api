"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertMiddleware = exports.metrics = exports.healthCheck = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
// Memory thresholds configured via environment variables
const MEMORY_CRITICAL_THRESHOLD_PERCENT = parseInt(process.env.MEMORY_CRITICAL_THRESHOLD_PERCENT || '90');
const MEMORY_WARNING_THRESHOLD_PERCENT = parseInt(process.env.MEMORY_WARNING_THRESHOLD_PERCENT || '70');
const healthCheck = async (_req, res) => {
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
            version: process.env.APP_VERSION || process.env.npm_package_version || '1.0.0',
            services: {
                database: dbHealth,
                redis: redisHealth,
                memory: memoryHealth
            }
        };
        const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
        logger_1.logger.info('Health check executed', {
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
        logger_1.logger.error('Critical error during health check', { message: err.message, stack: err.stack });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Internal error during health check.',
            details: err.message,
            uptime: process.uptime()
        });
    }
};
exports.healthCheck = healthCheck;
async function checkDatabaseHealth() {
    const start = Date.now();
    try {
        await client_1.default.$queryRaw `SELECT 1`;
        return {
            status: 'healthy',
            responseTime: Date.now() - start
        };
    }
    catch (error) {
        const err = error;
        logger_1.logger.error('Database health check failed', { message: err.message });
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
        if (!redis_1.redisService.isHealthy()) {
            logger_1.logger.warn('Redis health check: client not connected initially.');
            return {
                status: 'unhealthy',
                error: 'Redis not connected (initial check)',
                responseTime: Date.now() - start
            };
        }
        // Perform a quick set/get check with a short TTL
        await redis_1.redisService.set('health_check_ping', 'pong', 10);
        const pong = await redis_1.redisService.get('health_check_ping');
        if (pong !== 'pong') {
            throw new Error('Unexpected response from Redis PING/PONG command.');
        }
        return {
            status: 'healthy',
            responseTime: Date.now() - start
        };
    }
    catch (error) {
        const err = error;
        logger_1.logger.error('Redis health check failed', { message: err.message });
        return {
            status: 'unhealthy',
            error: err.message,
            responseTime: Date.now() - start
        };
    }
}
function checkMemoryHealth() {
    const memUsage = process.memoryUsage();
    const usedHeap = memUsage.heapUsed;
    const totalHeap = memUsage.heapTotal;
    const currentHeapPercentage = totalHeap > 0 ? (usedHeap / totalHeap) * 100 : 0;
    let status = 'healthy';
    if (currentHeapPercentage >= MEMORY_CRITICAL_THRESHOLD_PERCENT) {
        status = 'critical';
    }
    else if (currentHeapPercentage >= MEMORY_WARNING_THRESHOLD_PERCENT) {
        status = 'warning';
    }
    return {
        status,
        used: Math.round(usedHeap / 1024 / 1024),
        total: Math.round(totalHeap / 1024 / 1024),
        percentage: Math.round(currentHeapPercentage)
    };
}
function determineOverallStatus(db, redis, memory) {
    if (db.status === 'unhealthy') {
        return 'unhealthy';
    }
    if (redis.status === 'unhealthy' || memory.status === 'critical') {
        return 'degraded';
    }
    if (memory.status === 'warning') {
        return 'degraded';
    }
    return 'healthy';
}
const metrics = async (_req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const metricsText = `
# HELP nodejs_heap_space_size_used_bytes Process heap space used in bytes.
# TYPE nodejs_heap_space_size_used_bytes gauge
nodejs_heap_space_size_used_bytes ${memUsage.heapUsed}

# HELP nodejs_heap_space_size_total_bytes Process heap space total in bytes.
# TYPE nodejs_heap_space_size_total_bytes gauge
nodejs_heap_space_size_total_bytes ${memUsage.heapTotal}

# HELP nodejs_rss_bytes Resident set size in bytes.
# TYPE nodejs_rss_bytes gauge
nodejs_rss_bytes ${memUsage.rss}

# HELP process_uptime_seconds Process uptime in seconds.
# TYPE process_uptime_seconds counter
process_uptime_seconds ${process.uptime()}

# HELP process_cpu_user_seconds_total Total user CPU time in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total ${cpuUsage.user / 1000000}

# HELP process_cpu_system_seconds_total Total system CPU time in seconds.
# TYPE process_cpu_system_seconds_total counter
process_cpu_system_seconds_total ${cpuUsage.system / 1000000}
    `.trim();
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metricsText);
    }
    catch (error) {
        const err = error;
        logger_1.logger.error('Error generating metrics', { message: err.message });
        res.status(500).send(`# Error generating metrics: ${err.message}`);
    }
};
exports.metrics = metrics;
const alertMiddleware = (req, res, next) => {
    const originalSend = res.send;
    const requestStartTime = Date.now();
    res.send = function (chunk) {
        const durationMs = Date.now() - requestStartTime;
        if (res.statusCode >= 500) {
            logger_1.logger.error('Server error (>=500) detected', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                durationMs
            });
        }
        else if (res.statusCode >= 400) {
            logger_1.logger.warn('Client error (>=400) detected', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                durationMs
            });
        }
        return originalSend.call(this, chunk);
    };
    next();
};
exports.alertMiddleware = alertMiddleware;
//# sourceMappingURL=healthController.js.map