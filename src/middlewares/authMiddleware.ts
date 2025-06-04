import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { AppError } from '../errors/AppError'; // Sua classe de erro customizada
import { logger } from '../utils/logger';    // Seu logger Winston
import { PapelUsuario } from '@prisma/client'; // Enum para o papel do usuário

// Extensão do tipo Request do Express para incluir a propriedade user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        papel: PapelUsuario;
      };
    }
  }
}

// 1. Leitura e Validação Crítica do JWT_SECRET no nível do módulo
const JWT_SECRET_FROM_ENV = process.env.JWT_SECRET;

if (!JWT_SECRET_FROM_ENV) {
  const FATAL_ERROR_MSG = 'FATAL ERROR: JWT_SECRET não está definido nas variáveis de ambiente. A autenticação não pode funcionar sem ele.';
  logger.error(FATAL_ERROR_MSG);
  // Em um ambiente de produção, é mais seguro encerrar a aplicação.
  // Em desenvolvimento, lançar um erro pode ser suficiente para alertar o desenvolvedor.
  if (process.env.NODE_ENV === 'production') {
    process.exit(1); // Encerra o processo em produção
  } else {
    // Este erro será lançado quando o módulo for carregado pela primeira vez.
    // Isso impede que a aplicação inicie de forma inadequada.
    throw new Error(FATAL_ERROR_MSG);
  }
}
// Neste ponto, JWT_SECRET_FROM_ENV é garantidamente uma string.
const JWT_SECRET_KEY_TO_USE: Secret = JWT_SECRET_FROM_ENV;

// 2. Interface para o payload esperado do JWT (para tipagem de req.user)
// Esta interface deve corresponder ao payload que você define ao criar o token no AuthService.
interface DecodedUserPayload extends JwtPayload {
  userId: number;
  email: string;
  papel: PapelUsuario; // Usando o enum importado para forte tipagem
}

// 3. O Middleware de Autenticação
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  // Verifica se o cabeçalho de autorização existe e está no formato correto ("Bearer [token]")
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    logger.warn('Tentativa de acesso não autenticado: cabeçalho Authorization ausente ou malformado.', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    // Usa return para garantir que next() não seja chamado implicitamente
    return next(new AppError('Token de autenticação não fornecido ou malformado.', 401));
  }

  // Extrai o token do cabeçalho (remove o "Bearer ")
  const token = authHeader.substring(7);

  try {
    // Verifica e decodifica o token.
    // jwt.verify lançará um erro se o token for inválido (expirado, assinatura incorreta, etc.)
    const decoded = jwt.verify(token, JWT_SECRET_KEY_TO_USE) as DecodedUserPayload;

    // Validação adicional do conteúdo do payload decodificado (crucial para segurança e robustez)
    if (
      typeof decoded.userId !== 'number' ||
      typeof decoded.email !== 'string' ||
      !decoded.papel || // Verifica se a propriedade 'papel' existe
      !Object.values(PapelUsuario).includes(decoded.papel as PapelUsuario) // Verifica se é um valor válido do enum
    ) {
      logger.warn('Payload do token JWT inválido: campos ausentes, tipos incorretos ou papel inválido.', {
        decodedPayload: { userId: decoded.userId, email: decoded.email, papel: decoded.papel }, // Loga apenas campos relevantes
        path: req.path,
        ip: req.ip,
      });
      return next(new AppError('Token de autenticação com conteúdo inválido.', 401));
    }

    // Adiciona as informações do usuário ao objeto 'req' para uso nos controllers.
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      papel: decoded.papel,
    };

    logger.info('Usuário autenticado com sucesso via token', { userId: req.user.userId, path: req.path, method: req.method });
    next(); // Token válido, prossegue para o próximo middleware ou controller

  } catch (err: unknown) { // Captura 'unknown' e depois verifica o tipo do erro
    const error = err instanceof Error ? err : new Error(String(err)); // Garante que temos um objeto Error

    logger.warn('Falha na autenticação do token (jwt.verify falhou)', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      errorName: error.name,
      errorMessage: error.message,
    });

    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token de autenticação expirado. Por favor, faça login novamente.', 401));
    }
    // JsonWebTokenError é uma classe base para vários erros de token (malformado, assinatura inválida, etc.)
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token de autenticação inválido.', 401));
    }
    
    // Para outros erros inesperados durante a verificação do token
    return next(new AppError('Falha na autenticação. Não foi possível verificar o token.', 401));
  }
};