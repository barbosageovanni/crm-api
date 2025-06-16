// src/middlewares/AppError.ts - Versão Melhorada e Completa

/**
 * Interface para erros estruturados
 */
export interface StructuredError {
  field?: string;
  message: string;
  code?: string;
  location?: string;
  value?: any;
}

/**
 * Enum para códigos de erro comuns
 */
export enum ErrorCode {
  // Autenticação e Autorização
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validação
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Recursos
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Servidor
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
}

/**
 * Classe personalizada para erros da aplicação
 * Estende a classe Error nativa do JavaScript
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly errors?: StructuredError[];
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    errors?: StructuredError[],
    context?: Record<string, any>
  ) {
    super(message);
    
    // Mantém o nome da classe no stack trace
    this.name = this.constructor.name;
    
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true; // Indica que é um erro operacional, não um bug
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Captura o stack trace (se disponível)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converte o erro para formato JSON
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      errors: this.errors,
      timestamp: this.timestamp,
      context: this.context,
      stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined,
    };
  }

  /**
   * Verifica se é um erro de cliente (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Verifica se é um erro de servidor (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS PARA CRIAÇÃO DE ERROS COMUNS
  // ============================================================================

  /**
   * Cria um erro de não autorizado (401)
   */
  static unauthorized(message: string = 'Não autorizado', code?: string): AppError {
    return new AppError(message, 401, code || ErrorCode.UNAUTHORIZED);
  }

  /**
   * Cria um erro de acesso proibido (403)
   */
  static forbidden(message: string = 'Acesso proibido', code?: string): AppError {
    return new AppError(message, 403, code || ErrorCode.FORBIDDEN);
  }

  /**
   * Cria um erro de recurso não encontrado (404)
   */
  static notFound(resource: string = 'Recurso', code?: string): AppError {
    return new AppError(`${resource} não encontrado`, 404, code || ErrorCode.NOT_FOUND);
  }

  /**
   * Cria um erro de conflito (409)
   */
  static conflict(message: string = 'Conflito de dados', code?: string): AppError {
    return new AppError(message, 409, code || ErrorCode.CONFLICT);
  }

  /**
   * Cria um erro de validação (400)
   */
  static validationError(
    message: string = 'Dados inválidos',
    errors?: StructuredError[]
  ): AppError {
    return new AppError(message, 400, ErrorCode.VALIDATION_ERROR, errors);
  }

  /**
   * Cria um erro de entrada inválida (400)
   */
  static badRequest(message: string = 'Requisição inválida', code?: string): AppError {
    return new AppError(message, 400, code || ErrorCode.INVALID_INPUT);
  }

  /**
   * Cria um erro interno do servidor (500)
   */
  static internal(
    message: string = 'Erro interno do servidor',
    code?: string,
    context?: Record<string, any>
  ): AppError {
    return new AppError(message, 500, code || ErrorCode.INTERNAL_ERROR, undefined, context);
  }

  /**
   * Cria um erro de serviço indisponível (503)
   */
  static serviceUnavailable(
    message: string = 'Serviço temporariamente indisponível',
    code?: string
  ): AppError {
    return new AppError(message, 503, code || ErrorCode.SERVICE_UNAVAILABLE);
  }

  /**
   * Cria um erro de rate limiting (429)
   */
  static rateLimitExceeded(
    message: string = 'Muitas requisições. Tente novamente mais tarde.',
    retryAfter?: number
  ): AppError {
    const context = retryAfter ? { retryAfter } : undefined;
    return new AppError(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, undefined, context);
  }

  /**
   * Cria um erro de token expirado (401)
   */
  static tokenExpired(message: string = 'Token expirado'): AppError {
    return new AppError(message, 401, ErrorCode.TOKEN_EXPIRED);
  }

  /**
   * Cria um erro de token inválido (401)
   */
  static invalidToken(message: string = 'Token inválido'): AppError {
    return new AppError(message, 401, ErrorCode.INVALID_TOKEN);
  }

  /**
   * Cria um erro de credenciais inválidas (401)
   */
  static invalidCredentials(message: string = 'Credenciais inválidas'): AppError {
    return new AppError(message, 401, ErrorCode.INVALID_CREDENTIALS);
  }

  /**
   * Cria um erro de recurso já existente (409)
   */
  static alreadyExists(resource: string = 'Recurso', code?: string): AppError {
    return new AppError(`${resource} já existe`, 409, code || ErrorCode.ALREADY_EXISTS);
  }

  /**
   * Cria um erro de violação de regra de negócio (422)
   */
  static businessRuleViolation(message: string, code?: string): AppError {
    return new AppError(message, 422, code || ErrorCode.BUSINESS_RULE_VIOLATION);
  }

  /**
   * Cria um erro de permissões insuficientes (403)
   */
  static insufficientPermissions(message: string = 'Permissões insuficientes'): AppError {
    return new AppError(message, 403, ErrorCode.INSUFFICIENT_PERMISSIONS);
  }

  /**
   * Cria um AppError a partir de um erro genérico
   */
  static fromError(error: Error, statusCode: number = 500, code?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(
      error.message || 'Erro desconhecido',
      statusCode,
      code,
      undefined,
      { originalError: error.name }
    );
  }
}

/**
 * Type guard para verificar se um erro é uma instância de AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Extrai informações relevantes de um erro para logging
 */
export function extractErrorInfo(error: Error | AppError): Record<string, any> {
  const info: Record<string, any> = {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  };

  if (isAppError(error)) {
    info.statusCode = error.statusCode;
    info.code = error.code;
    info.errors = error.errors;
    info.timestamp = error.timestamp;
    info.context = error.context;
    info.isOperational = error.isOperational;
  }

  return info;
}