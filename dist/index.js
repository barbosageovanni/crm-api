"use strict";
// src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = require("./utils/logger");
const AppError_1 = require("./errors/AppError");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const healthController_1 = require("./controllers/healthController");
const clienteRoutes_1 = __importDefault(require("./routes/clienteRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authMiddleware_1 = require("./middlewares/authMiddleware");
const redis_1 = require("./config/redis");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set('trust proxy', 1);
// Segurança e parsing
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Logging HTTP
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use((0, morgan_1.default)(morganFormat, {
    stream: { write: (msg) => logger_1.logger.http(msg.trim()) },
}));
// Alertas e rate limiting
app.use(healthController_1.alertMiddleware);
app.use(rateLimiter_1.routeBasedLimiter);
// Rotas públicas
app.use('/auth', authRoutes_1.default);
// Conecta Redis antes de iniciar rotas protegidas
redis_1.redisService
    .connect()
    .then(() => logger_1.logger.info('Redis conectado'))
    .catch((err) => logger_1.logger.error('Falha ao conectar no Redis', { error: err }));
// Rotas protegidas
app.use('/clientes', authMiddleware_1.authMiddleware, clienteRoutes_1.default);
app.use('/users', authMiddleware_1.authMiddleware, userRoutes_1.default);
// Health & metrics
app.get('/health', healthController_1.healthCheck);
app.get('/metrics', healthController_1.metrics);
// Redis status opcional
app.get('/redis-status', (_req, res) => {
    const healthy = redis_1.redisService.isHealthy();
    res.json({ redis: healthy ? 'ok' : 'down' });
});
// Rota raiz
app.get('/', (_req, res) => {
    res.send('API CRM Transpontual está online!');
});
// 404 handler
app.use((_req, _res, next) => {
    next(new AppError_1.AppError(`Rota não encontrada: ${_req.method} ${_req.originalUrl}`, 404));
});
// Error handler
app.use((err, _req, res, _next) => {
    if (err instanceof AppError_1.AppError) {
        logger_1.logger.warn('AppError capturada', {
            status: err.statusCode,
            message: err.message,
            errors: err.errors,
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        });
        return res.status(err.statusCode).json({ status: 'error', message: err.message, errors: err.errors });
    }
    logger_1.logger.error('Erro inesperado', {
        message: err.message,
        stack: err.stack,
    });
    const message = process.env.NODE_ENV === 'production' ? 'Erro interno no servidor.' : err.message;
    return res.status(500).json({ status: 'error', message });
});
// Inicia servidor
const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger_1.logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map