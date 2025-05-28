// src/middlewares/monitoring.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Middleware para métricas de request
export const requestMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log do request
  logger.info('Request iniciado', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Interceptar o response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log do response
    logger.info('Request finalizado', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    });

    // Alertas para requests lentos
    if (duration > 5000) {
      logger.warn('Request lento detectado', {
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

// src/controllers/healthController.ts
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { redisService } from '../config/redis';
import { logger } from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    memory: MemoryHealth;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

interface MemoryHealth {
  status: 'healthy' | 'warning' | 'critical';
  used: number;
  total: number;
  percentage: number;
}

export const healthCheck = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Verificar database
    const dbHealth = await checkDatabaseHealth();
    
    // Verificar Redis
    const redisHealth = await checkRedisHealth();
    
    // Verificar memória
    const memoryHealth = checkMemoryHealth();
    
    // Determinar status geral
    const overallStatus = determineOverallStatus(dbHealth, redisHealth, memoryHealth);
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbHealth,
        redis: redisHealth,
        memory: memoryHealth
      }
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    logger.info('Health check executado', {
      status: overallStatus,
      duration: Date.now() - startTime,
      services: {
        database: dbHealth.status,
        redis: redisHealth.status,
        memory: memoryHealth.status
      }
    });

    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Erro no health check', error as Error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: process.uptime()
    });
  }
};

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: (error as Error).message
    };
  }
}

async function checkRedisHealth(): Promise<ServiceHealth> {
  try {
    if (!redisService.isHealthy()) {
      return {
        status: 'unhealthy',
        error: 'Redis não conectado'
      };
    }

    const start = Date.now();
    await redisService.set('health_check', 'ok', 10);
    await redisService.get('health_check');
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: (error as Error).message
    };
  }
}

function checkMemoryHealth(): MemoryHealth {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;
  const percentage = (usedMemory / totalMemory) * 100;
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (percentage >= 90) {
    status = 'critical';
  } else if (percentage >= 70) {
    status = 'warning';
  }
  
  return {
    status,
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round(percentage)
  };
}

function determineOverallStatus(
  db: ServiceHealth, 
  redis: ServiceHealth, 
  memory: MemoryHealth
): 'healthy' | 'degraded' | 'unhealthy' {
  // Sistema está unhealthy se database estiver down
  if (db.status === 'unhealthy') {
    return 'unhealthy';
  }
  
  // Sistema está degraded se Redis estiver down ou memória crítica
  if (redis.status === 'unhealthy' || memory.status === 'critical') {
    return 'degraded';
  }
  
  // Sistema está degraded se memória estiver em warning
  if (memory.status === 'warning') {
    return 'degraded';
  }
  
  return 'healthy';
}

// Endpoint para métricas básicas (formato Prometheus-like)
export const metrics = async (req: Request, res: Response) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Métricas em formato texto simples
    const metricsText = `
# HELP nodejs_memory_heap_used_bytes Node.js heap memory used
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP nodejs_memory_heap_total_bytes Node.js heap memory total
# TYPE nodejs_memory_heap_total_bytes gauge
nodejs_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP nodejs_process_uptime_seconds Node.js process uptime
# TYPE nodejs_process_uptime_seconds counter
nodejs_process_uptime_seconds ${process.uptime()}

# HELP nodejs_process_cpu_user_seconds_total Node.js process CPU user time
# TYPE nodejs_process_cpu_user_seconds_total counter
nodejs_process_cpu_user_seconds_total ${cpuUsage.user / 1000000}

# HELP nodejs_process_cpu_system_seconds_total Node.js process CPU system time
# TYPE nodejs_process_cpu_system_seconds_total counter
nodejs_process_cpu_system_seconds_total ${cpuUsage.system / 1000000}
`.trim();

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metricsText);
    
  } catch (error) {
    logger.error('Erro ao gerar métricas', error as Error);
    res.status(500).send('Error generating metrics');
  }
};

// Middleware para alertas automáticos
export const alertMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Alertas para status codes problemáticos
    if (res.statusCode >= 500) {
      logger.error('Erro 5xx detectado', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};