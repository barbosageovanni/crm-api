import { Request, Response, NextFunction } from 'express';
/**
 * Validação para criação de Cliente
 */
export declare const validateCreateCliente: any[];
/**
 * Validação para atualização de Cliente
 */
export declare const validateUpdateCliente: any[];
/**
 * Validação para buscar cliente por ID
 */
export declare const validateGetCliente: any[];
/**
 * Middleware para tratar erros de validação
 */
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=clienteValidator.d.ts.map