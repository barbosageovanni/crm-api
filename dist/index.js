"use strict";
// src/index.ts - Versão Otimizada com Redis Funcionando
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
// Carrega as variáveis de ambiente PRIMEIRO
dotenv_1.default.config();
// Módulos da aplicação
const logger_1 = require("./utils/logger");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const monitoring_1 = require("./middlewares/monitoring");
const redis_1 = require("./config/redis");
// Importar os handlers de erro do caminho correto
const errorHandler_1 = require("./middlewares/errorHandler");
// Importar as rotas
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const clienteRoutes_1 = __importDefault(require("./routes/clienteRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const transporteRoutes_1 = __importDefault(require("./routes/transporteRoutes"));
// Carrega as variáveis de ambiente PRIMEIRO
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configuração de Proxy para produção
app.set('trust proxy', 1);
// ============================================================================
// MIDDLEWARES GLOBAIS
// ============================================================================
// Middleware de Métricas de Request (antes de tudo)
app.use(monitoring_1.requestMetrics);
// Configuração de Proxy para produção
app.set('trust proxy', 1);
// ============================================================================
// MIDDLEWARES GLOBAIS
// ============================================================================
// Middleware de Métricas de Request (antes de tudo)
app.use(monitoring_1.requestMetrics);
// Middlewares de Segurança
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
// Middlewares para Parse do Corpo da Requisição
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Middleware de Logging HTTP
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use((0, morgan_1.default)(morganFormat, {
    stream: {
        write: (message) => {
            logger_1.logger.http(message.trim());
        },
    },
    skip: (req) => {
        return process.env.NODE_ENV === 'production' && req.url === '/health';
    },
}));
// ============================================================================
// ROTAS DA APLICAÇÃO
// ============================================================================
// Rotas Públicas (sem autenticação)
app.use('/auth', authRoutes_1.default);
// Rotas Protegidas (requerem autenticação)
app.use('/clientes', clienteRoutes_1.default);
app.use('/users', userRoutes_1.default);
app.use('/transportes', transporteRoutes_1.default);
// ============================================================================
// ROTAS DE SISTEMA E MONITORAMENTO
// ============================================================================
// Rotas de Monitoramento
app.get('/health', monitoring_1.healthCheck);
app.get('/metrics', monitoring_1.metrics);
// Rota para status do Redis
app.get('/redis-status', (req, res) => {
    const status = redis_1.redisService.getStatus();
    res.json({
        redis: {
            ...status,
            message: status.isHealthy ? 'Redis conectado e funcionando' : 'Redis não disponível',
            timestamp: new Date().toISOString(),
        },
    });
});
// Rota Raiz
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'API CRM Transpontual está online e operante!',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
    });
});
// ============================================================================
// HANDLERS DE ERRO (sempre por último)
// ============================================================================
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// ============================================================================
// INICIALIZAÇÃO DE SERVIÇOS E SERVIDOR
// ============================================================================
async function initializeServices() {
    const services = [];
    // Inicializar Redis com retry otimizado
    try {
        await redis_1.redisService.connect();
        logger_1.logger.info('✅ Redis conectado com sucesso', {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || '6379',
        });
        services.push('Redis');
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger_1.logger.warn('⚠️  Redis não disponível - API funcionará sem cache', {
            error: err.message,
        });
    }
    // TODO: Adicionar outros serviços aqui (MongoDB, PostgreSQL, etc.)
    if (services.length > 0) {
        logger_1.logger.info(`🔗 Serviços inicializados: ${services.join(', ')}`);
    }
    else {
        logger_1.logger.warn('⚠️  Nenhum serviço externo conectado - funcionando em modo degradado');
    }
}
async function gracefulShutdown(signal) {
    logger_1.logger.info(`🔄 Iniciando shutdown gracioso devido ao sinal: ${signal}`);
    const shutdownTimeout = setTimeout(() => {
        logger_1.logger.error('❌ Timeout no shutdown - forçando encerramento');
        process.exit(1);
    }, 10000); // 10 segundos timeout
    try {
        // Desconectar Redis
        await redis_1.redisService.disconnect();
        logger_1.logger.info('✅ Redis desconectado');
        // TODO: Desconectar outros serviços aqui
        clearTimeout(shutdownTimeout);
        logger_1.logger.info('✅ Shutdown concluído com sucesso');
        process.exit(0);
    }
    catch (error) {
        clearTimeout(shutdownTimeout);
        const err = error instanceof Error ? error : new Error(String(error));
        logger_1.logger.error('❌ Erro durante shutdown', { error: err.message });
        process.exit(1);
    }
}
// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
// Só inicializa o servidor se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
    initializeServices()
        .then(() => {
        const server = app.listen(PORT, HOST, () => {
            logger_1.logger.info(`🚀 Servidor CRM Transpontual iniciado com sucesso!`, {
                port: PORT,
                host: HOST,
                environment: process.env.NODE_ENV || 'development',
                version: process.env.APP_VERSION || '1.0.0',
                nodeVersion: process.version,
            });
            // URLs úteis
            const baseUrl = `http://${HOST}:${PORT}`;
            logger_1.logger.info(`� URLs disponíveis:`, {
                api: baseUrl,
                health: `${baseUrl}/health`,
                metrics: `${baseUrl}/metrics`,
                redis: `${baseUrl}/redis-status`,
                auth: `${baseUrl}/auth`,
            });
        });
        // Configurações do servidor
        server.timeout = 30000; // 30 segundos
        server.keepAliveTimeout = 5000; // 5 segundos
        server.headersTimeout = 6000; // 6 segundos (maior que keepAliveTimeout)
        // Salvar referência do servidor para shutdown gracioso
        process.server = server;
    })
        .catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger_1.logger.error('❌ Falha crítica na inicialização da aplicação', {
            error: err.message,
            stack: err.stack,
        });
        process.exit(1);
    });
    // ============================================================================
    // HANDLERS DE SHUTDOWN GRACIOSO
    // ============================================================================
    // Handlers para sinais do sistema
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    // Handlers para erros não tratados
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('❌ Exceção não capturada - encerrando aplicação', {
            error: error.message,
            stack: error.stack,
        });
        gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('❌ Promise rejeitada não tratada - encerrando aplicação', {
            reason: String(reason),
            promise: promise.toString(),
        });
        gracefulShutdown('unhandledRejection');
    });
    // Handler para warnings (não encerra a aplicação)
    process.on('warning', (warning) => {
        logger_1.logger.warn('⚠️  Warning detectado', {
            name: warning.name,
            message: warning.message,
            stack: warning.stack,
        });
    });
}
// Middlewares Customizados
app.use(rateLimiter_1.routeBasedLimiter);
exports.default = app;
//# sourceMappingURL=index.js.map