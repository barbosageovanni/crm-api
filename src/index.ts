// src/index.ts - Versão Corrigida

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

// Módulos da sua aplicação
import { logger } from './utils/logger';
import { AppError } from './errors/AppError';
import { routeBasedLimiter } from './middlewares/rateLimiter';
import { alertMiddleware, healthCheck, metrics } from './controllers/healthController';
import clienteRoutes from './routes/clienteRoutes';
import { redisService } from './config/redis';
import authRoutes from './routes/authRoutes'; // Importação está correta

// Carrega as variáveis de ambiente do arquivo .env
// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();

// Configuração de Proxy
app.set('trust proxy', 1);

// Middlewares de Segurança e Utilidades Essenciais
app.use(helmet());
app.use(cors());

// Middlewares para Parse do Corpo da Requisição
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de Logging de Requisições HTTP (Morgan)
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
  })
);

// Middlewares Customizados
app.use(alertMiddleware);
app.use(routeBasedLimiter);

// Rotas da Aplicação
app.use('/auth', authRoutes);
app.use('/clientes', clienteRoutes);
// Adicione outras rotas principais aqui

// Rotas de Health Check e Métricas
app.get('/health', healthCheck);
app.get('/metrics', metrics);

// Rota para status do Redis (útil para debug)
app.get('/redis-status', (req: Request, res: Response) => {
  const status = redisService.getStatus();
  res.json({
    redis: {
      ...status,
      message: status.isHealthy ? 'Redis está funcionando' : 'Redis não disponível'
    }
  });
});

// Rota Raiz
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('API CRM Transpontual está online e operante!');
});

// Middleware para Tratamento de Rotas Não Encontradas (404)
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Rota não encontrada: ${req.method} ${req.originalUrl}`, 404));
});

// Middleware Global de Tratamento de Erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn('AppError capturada pelo handler global', {
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
      errors: err.errors,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  logger.error('Erro inesperado capturado pelo handler global', {
    message: err.message,
    path: req.path,
    method: req.method,
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
  // Inicializar Redis (opcional - funciona sem)
  try {
    await redisService.connect();
    logger.info('✅ Redis conectado com sucesso');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('⚠️  Redis não disponível - API funcionará sem cache', {
      error: err.message,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379'
    });
  }

  // Aqui você pode inicializar outros serviços (DB, etc.)
  // Por exemplo:
  // await initializeDatabase();
  // await initializeOtherServices();
}

// Função para shutdown gracioso
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`🛑 Recebido sinal ${signal}. Iniciando shutdown gracioso...`);
  
  try {
    // Desconectar Redis
    await redisService.disconnect();
    logger.info('✅ Redis desconectado');
    
    // Aqui você pode fechar outras conexões (DB, etc.)
    
    logger.info('✅ Shutdown concluído com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro durante shutdown', { error: (error as Error).message });
    process.exit(1);
  }
}

// Inicialização do Servidor
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  // Inicializar serviços e depois iniciar o servidor
  initializeServices()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
        logger.info(`📡 Health check disponível em: http://localhost:${PORT}/health`);
        logger.info(`📊 Métricas disponíveis em: http://localhost:${PORT}/metrics`);
        logger.info(`🔧 Status Redis em: http://localhost:${PORT}/redis-status`);
      });
    })
    .catch((error) => {
      logger.error('❌ Falha crítica na inicialização da aplicação', { 
        error: (error as Error).message,
        stack: (error as Error).stack 
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
      stack: error.stack 
    });
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promise rejeitada não tratada', { 
      reason: String(reason),
      promise: promise.toString()
    });
    gracefulShutdown('unhandledRejection');
  });
}

export default app;