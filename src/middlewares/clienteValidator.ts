// src/middlewares/clienteValidator.ts - VERSÃO CORRIGIDA E CENTRALIZADA

import { body, query, param } from 'express-validator';
import { $Enums } from '@prisma/client';
import { cpf, cnpj } from 'cpf-cnpj-validator'; // Usando uma biblioteca para robustez

const ALLOWED_TIPO_CLIENTE = Object.values($Enums.TipoCliente);

// Validação para CRIAÇÃO de Cliente
export const validateCreateCliente = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 3, max: 100 }).escape(),
  body('tipo').isIn(ALLOWED_TIPO_CLIENTE).withMessage(`Tipo deve ser um dos seguintes: ${ALLOWED_TIPO_CLIENTE.join(', ')}.`),
  body('cnpjCpf').trim().notEmpty().withMessage('CNPJ/CPF é obrigatório.').custom((value, { req }) => {
    const tipo = req.body.tipo;
    const cleanValue = String(value).replace(/\D/g, '');
    if (tipo === 'PF' && !cpf.isValid(cleanValue)) {
      throw new Error('CPF fornecido é inválido.');
    }
    if (tipo === 'PJ' && !cnpj.isValid(cleanValue)) {
      throw new Error('CNPJ fornecido é inválido.');
    }
    return true;
  }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('telefone').optional({ checkFalsy: true }).isString().trim().escape(),
  body('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano.'),
];

// Validação para ATUALIZAÇÃO de Cliente
export const validateUpdateCliente = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido.'),
  body('nome').optional().trim().notEmpty().isLength({ min: 3, max: 100 }).escape(),
  body('tipo').optional().isIn(ALLOWED_TIPO_CLIENTE),
  body('cnpjCpf').optional().trim().custom((value, { req }) => {
      // Esta validação pode ser mais complexa se o tipo também puder ser alterado.
      // Por simplicidade, validamos apenas se o tipo for fornecido na mesma requisição.
      const tipo = req.body.tipo;
      if (value && tipo) {
          const cleanValue = String(value).replace(/\D/g, '');
          if (tipo === 'PF' && !cpf.isValid(cleanValue)) throw new Error('CPF inválido para o tipo PF.');
          if (tipo === 'PJ' && !cnpj.isValid(cleanValue)) throw new Error('CNPJ inválido para o tipo PJ.');
      }
      return true;
  }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('telefone').optional({ checkFalsy: true }).isString().trim().escape(),
  body('ativo').optional().isBoolean(),
];

// Validação para PARÂMETROS DE BUSCA (Query)
export const validateListClientes = [
    query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um inteiro positivo.').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100.').toInt(),
    query('sortBy').optional().isString().trim().escape(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano.').toBoolean(),
];

// Validação para ID em PARÂMETROS de Rota
export const validateIdParam = [
    param('id').isInt({ min: 1 }).withMessage('ID na rota é inválido.').toInt()
];