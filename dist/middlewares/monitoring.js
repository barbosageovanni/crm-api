"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestMetrics = void 0;
const logger_1 = require("../utils/logger");
// Middleware para métricas de request
const requestMetrics = (req, res, next) => {
    const startTime = Date.now();
    // Log do request
    logger_1.logger.info('Request iniciado', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    // Interceptar o response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        // Log do response
        logger_1.logger.info('Request finalizado', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date().toISOString()
        });
        // Alertas para requests lentos
        if (duration > 5000) {
            logger_1.logger.warn('Request lento detectado', {
                method: req.method,
                url: req.originalUrl,
                duration,
                statusCode: res.statusCode
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.requestMetrics = requestMetrics;
//# sourceMappingURL=monitoring.js.map