export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(message: string, statusCode = 500, errors?: any[]) {
    super(message);
    
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    // Captura o stack trace para debugging
    Error.captureStackTrace(this, this.constructor);
  }
}
