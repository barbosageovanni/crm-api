// src/index.ts - Versão Corrigida e Unificada

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

// Módulos da aplicação
import { logger } from './utils/logger';
import { AppError } from './middlewares/AppError';
import { routeBasedLimiter } from './middlewares/rateLimiter';
import { alertMiddleware, healthCheck, metrics } from './controllers/healthController';
import { redisService } from './config/redis';

// Importações de rotas (usando import default consistente)
import authRoutes from './routes/authRoutes';
import clienteRoutes from './routes/clienteRoutes';
import userRoutes from './routes/userRoutes';
import transporteRoutes from './routes/transporteRoutes';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Configuração de Proxy
app.set('trust proxy', 1);

// Middlewares de Segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Middlewares para Parse do Corpo da Requisição
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de Logging HTTP
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
    skip: (req) => {
      // Pula logs de health check em produção para reduzir ruído
      return process.env.NODE_ENV === 'production' && req.url === '/health';
    },
  })
);

// Middlewares Customizados
app.use(alertMiddleware);
app.use(routeBasedLimiter);

// Rotas Públicas
app.use('/auth', authRoutes);

// Rotas Protegidas (requerem autenticação)
app.use('/clientes', clienteRoutes);
app.use('/users', userRoutes);
app.use('/transportes', transporteRoutes);

// Rotas de Monitoramento
app.get('/health', healthCheck);
app.get('/metrics', metrics);

// Rota para status do Redis
app.get('/redis-status', (req: Request, res: Response) => {
  const status = redisService.getStatus();
  res.json({
    redis: {
      ...status,
      message: status.isHealthy ? 'Redis conectado e funcionando' : 'Redis não disponível',
      timestamp: new Date().toISOString(),
    },
  });
});

// Rota Raiz
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'API CRM Transpontual está online e operante!',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Middleware para Rotas Não Encontradas (404)
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
});

// Middleware Global de Tratamento de Erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Se a resposta já foi enviada, delega para o handler padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    logger.warn('AppError capturada pelo handler global', {
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errors: err.errors,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errors: err.errors || undefined,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  }

  // Erro não esperado
  logger.error('Erro inesperado capturado pelo handler global', {
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: err.stack,
  });

  const displayMessage =
    process.env.NODE_ENV === 'production'
      ? 'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.'
      : err.message;

  return res.status(500).json({
    status: 'error',
    message: displayMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Função para inicializar serviços externos
async function initializeServices(): Promise<void> {
  const services = [];

  // Inicializar Redis
  try {
    await redisService.connect();
    logger.info('✅ Redis conectado com sucesso', {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
    });
    services.push('Redis');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('⚠️  Redis não disponível - API funcionará sem cache', {
      error: err.message,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
    });
  }

  // Aqui você pode adicionar outros serviços
  // Exemplo: await initializeDatabase();

  logger.info('🔧 Serviços inicializados', { services });
}

// Função para shutdown gracioso
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`🛑 Recebido sinal ${signal}. Iniciando shutdown gracioso...`);

  try {
    // Desconectar Redis
    await redisService.disconnect();
    logger.info('✅ Redis desconectado');

    // Aqui você pode fechar outras conexões (DB, queues, etc.)
    
    logger.info('✅ Shutdown concluído com sucesso');
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Erro durante shutdown', { error: err.message });
    process.exit(1);
  }
}

// Inicialização do Servidor
const PORT = parseInt(process.env.PORT || '4000', 10);

// Só inicializa o servidor se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
  initializeServices()
    .then(() => {
      const server = app.listen(PORT, () => {
        logger.info(`🚀 Servidor rodando na porta ${PORT}`, {
          environment: process.env.NODE_ENV || 'development',
          version: process.env.APP_VERSION || '1.0.0',
        });
        logger.info(`📡 Health check: http://localhost:${PORT}/health`);
        logger.info(`📊 Métricas: http://localhost:${PORT}/metrics`);
        logger.info(`🔧 Status Redis: http://localhost:${PORT}/redis-status`);
      });

      // Configurar timeout do servidor
      server.timeout = 30000; // 30 segundos
    })
    .catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('❌ Falha crítica na inicialização da aplicação', {
        error: err.message,
        stack: err.stack,
      });
      process.exit(1);
    });

  // Handlers para shutdown gracioso
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handler para erros não capturados
  process.on('uncaughtException', (error) => {
    logger.error('❌ Exceção não capturada', {
      error: error.message,
      stack: error.stack,
    });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promise rejeitada não tratada', {
      reason: String(reason),
      promise: promise.toString(),
    });
    gracefulShutdown('unhandledRejection');
  });
}

export default app;