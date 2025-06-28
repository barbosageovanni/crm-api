// src/index.ts - Versão Otimizada com Redis Funcionando

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

// Carrega as variáveis de ambiente PRIMEIRO
dotenv.config();

// Módulos da aplicação
import { logger } from './utils/logger';
import { AppError } from './errors/AppError';
import { routeBasedLimiter } from './middlewares/rateLimiter';
import { healthCheck, metrics, requestMetrics } from './middlewares/monitoring';
import { redisService } from './config/redis';

// Importar os handlers de erro do caminho correto
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';

// Importar as rotas
import authRoutes from './routes/authRoutes';
import clienteRoutes from './routes/clienteRoutes';
import userRoutes from './routes/userRoutes';
import transporteRoutes from './routes/transporteRoutes';

const app = express();

// Configuração de Proxy para produção
app.set('trust proxy', 1);

// ============================================================================
// MIDDLEWARES GLOBAIS
// ============================================================================

// Middleware de Métricas de Request (antes de tudo)
app.use(requestMetrics);

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
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4001'],
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
      return process.env.NODE_ENV === 'production' && req.url === '/health';
    },
  })
);

// Rate Limiting
app.use(routeBasedLimiter);

// ============================================================================
// ROTAS DA APLICAÇÃO
// ============================================================================

// Rotas Públicas (sem autenticação)
app.use('/api/auth', authRoutes);

// Rotas Protegidas (requerem autenticação)
app.use('/api/clientes', clienteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transportes', transporteRoutes);

// ============================================================================
// ROTAS DE SISTEMA E MONITORAMENTO
// ============================================================================

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

// ============================================================================
// HANDLERS DE ERRO (sempre por último)
// ============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// INICIALIZAÇÃO DE SERVIÇOS E SERVIDOR
// ============================================================================

async function initializeServices(): Promise<void> {
  const services: string[] = [];

  // Inicializar Redis com retry otimizado
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
    });
  }

  // TODO: Adicionar outros serviços aqui (MongoDB, PostgreSQL, etc.)

  if (services.length > 0) {
    logger.info(`🔗 Serviços inicializados: ${services.join(', ')}`);
  } else {
    logger.warn('⚠️  Nenhum serviço externo conectado - funcionando em modo degradado');
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`🔄 Iniciando shutdown gracioso devido ao sinal: ${signal}`);
  
  const shutdownTimeout = setTimeout(() => {
    logger.error('❌ Timeout no shutdown - forçando encerramento');
    process.exit(1);
  }, 10000); // 10 segundos timeout

  try {
    // Desconectar Redis
    await redisService.disconnect();
    logger.info('✅ Redis desconectado');
    
    // TODO: Desconectar outros serviços aqui
    
    clearTimeout(shutdownTimeout);
    logger.info('✅ Shutdown concluído com sucesso');
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimeout);
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Erro durante shutdown', { error: err.message });
    process.exit(1);
  }
}

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

const PORT = parseInt(process.env.PORT || '4004', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Só inicializa o servidor se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
  initializeServices()
    .then(() => {
      const server = app.listen(PORT, HOST, () => {
        logger.info(`🚀 Servidor CRM Transpontual iniciado com sucesso!`, {
          port: PORT,
          host: HOST,
          environment: process.env.NODE_ENV || 'development',
          version: process.env.APP_VERSION || '1.0.0',
          nodeVersion: process.version,
        });
        
        // URLs úteis
        const baseUrl = `http://${HOST}:${PORT}`;
        logger.info(`📋 URLs disponíveis:`, {
          api: baseUrl,
          health: `${baseUrl}/health`,
          metrics: `${baseUrl}/metrics`,
          redis: `${baseUrl}/redis-status`,
          auth: `${baseUrl}/api/auth`,
        });
      });

      // Configurações do servidor
      server.timeout = 30000; // 30 segundos
      server.keepAliveTimeout = 5000; // 5 segundos
      server.headersTimeout = 6000; // 6 segundos (maior que keepAliveTimeout)

      // Salvar referência do servidor para shutdown gracioso
      (process as any).server = server;
    })
    .catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('❌ Falha crítica na inicialização da aplicação', {
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
    logger.error('❌ Exceção não capturada - encerrando aplicação', {
      error: error.message,
      stack: error.stack,
    });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promise rejeitada não tratada - encerrando aplicação', {
      reason: String(reason),
      promise: promise.toString(),
    });
    gracefulShutdown('unhandledRejection');
  });

  // Handler para warnings (não encerra a aplicação)
  process.on('warning', (warning) => {
    logger.warn('⚠️  Warning detectado', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });
}

export default app;
