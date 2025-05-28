import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { cpf, cnpj } from 'cpf-cnpj-validator';

/**
 * Validação para criação de Cliente
 */
export const validateCreateCliente = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ max: 100 }).withMessage('Nome pode ter até 100 caracteres')
    .escape(),

  // CNPJ/CPF agora opcional, mas se fornecido deve ser válido
  body('cnpjCpf')
    .optional()
    .trim()
    .custom(value => {
      // Se valor está presente, validar
      if (value && !(cpf.isValid(value) || cnpj.isValid(value))) {
        throw new Error('CNPJ/CPF inválido');
      }
      return true;
    })
    .escape(),

  body('tipo')
    .trim()
    .notEmpty().withMessage('Tipo é obrigatório')
    .isIn(['PJ', 'PF']).withMessage('Tipo deve ser "PJ" ou "PF"')
    .escape(),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
];

/**
 * Validação para atualização de Cliente
 */
export const validateUpdateCliente = [
  param('id')
    .isInt({ gt: 0 }).withMessage('ID deve ser um número inteiro positivo'),

  body('nome')
    .optional()
    .trim()
    .notEmpty().withMessage('Nome não pode ser vazio')
    .isLength({ max: 100 }).withMessage('Nome pode ter até 100 caracteres')
    .escape(),

  body('cnpjCpf')
    .optional()
    .trim()
    .custom(value => {
      // Se valor está presente, validar
      if (value && !(cpf.isValid(value) || cnpj.isValid(value))) {
        throw new Error('CNPJ/CPF inválido');
      }
      return true;
    })
    .escape(),

  body('tipo')
    .optional()
    .trim()
    .isIn(['PJ', 'PF']).withMessage('Tipo deve ser "PJ" ou "PF"')
    .escape(),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('ativo')
    .optional()
    .isBoolean().withMessage('Ativo deve ser booleano'),
];

/**
 * Validação para buscar cliente por ID
 */
export const validateGetCliente = [
  param('id')
    .isInt({ gt: 0 }).withMessage('ID deve ser um número inteiro positivo'),
];

/**
 * Middleware para tratar erros de validação
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map(error => ({
    field: (error as any).param || (error as any).path || 'unknown',
    message: error.msg,
    ...(error as any).value !== undefined && { value: (error as any).value }
  }));

  return res.status(400).json({
    message: 'Erro de validação',
    errors: formattedErrors
  });
};