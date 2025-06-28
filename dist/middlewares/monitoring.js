"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = exports.healthCheck = exports.requestMetrics = void 0;
const logger_1 = require("../utils/logger");
const requestMetrics = (req, res, next) => {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent');
    logger_1.logger.info('Request iniciado', { method, url: originalUrl, ip, userAgent });
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { statusCode } = res;
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        logger_1.logger[level]('Request finalizado', {
            method,
            url: originalUrl,
            statusCode,
            durationMs: duration,
            ip
        });
        if (duration > 5000) {
            logger_1.logger.warn('Request lento detectado', {
                method,
                url: originalUrl,
                durationMs: duration,
                statusCode,
            });
        }
    });
    next();
};
exports.requestMetrics = requestMetrics;
const healthCheck = (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
    });
};
exports.healthCheck = healthCheck;
const metrics = (req, res) => {
    const memoryUsage = process.memoryUsage();
    res.set('Content-Type', 'text/plain');
    res.send(`
# Memory Usage
nodejs_memory_usage_rss_bytes ${memoryUsage.rss}
nodejs_memory_usage_heap_total_bytes ${memoryUsage.heapTotal}
nodejs_memory_usage_heap_used_bytes ${memoryUsage.heapUsed}
nodejs_memory_usage_external_bytes ${memoryUsage.external}
# Process Info
nodejs_uptime_seconds ${process.uptime()}
  `.trim());
};
exports.metrics = metrics;
//# sourceMappingURL=monitoring.js.map