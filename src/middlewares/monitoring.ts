// src/middlewares/monitoring.ts - VERSÃO ATUALIZADA

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('User-Agent');
  
  logger.info('Request iniciado', { method, url: originalUrl, ip, userAgent });

  // REVISÃO: Usando o evento 'finish' em vez de interceptar 'res.send'.
  // Esta é uma abordagem muito mais robusta e recomendada.
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    logger[level]('Request finalizado', {
      method,
      url: originalUrl,
      statusCode,
      durationMs: duration,
      ip
    });

    if (duration > 5000) { // Limite de 5 segundos
      logger.warn('Request lento detectado', {
        method,
        url: originalUrl,
        durationMs: duration,
        statusCode,
      });
    }
  });

  next();
};