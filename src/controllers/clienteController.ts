import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult, matchedData } from 'express-validator';
import { clienteService } from '../services/clienteService'; // Caminho ajustado (verifique o seu)
import { $Enums, TipoCliente as PrismaTipoCliente } from '@prisma/client';
import { CreateClienteDTO, UpdateClienteDTO, ClienteFilters, PaginationOptions } from '../dtos/clienteDtos'; // Caminho ajustado
import { AppError, ValidationError as CustomValidationError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { cpf, cnpj } from 'cpf-cnpj-validator'; // Para validações customizadas

// Helper para lidar com erros de validação
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Erro de validação de entrada no clienteController', {
      errors: errors.array({ onlyFirstError: true }), path: req.path, method: req.method,
    });
    return next(new CustomValidationError(errors.array({ onlyFirstError: true }), 'Dados de entrada inválidos.'));
  }
  next();
};

export const list = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Página deve ser um número inteiro positivo.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limite deve ser um número inteiro entre 1 e 100.'),
  query('sortBy').optional().isString().trim().escape(),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordem de classificação deve ser "asc" ou "desc".'),
  query('nome').optional().isString().trim().escape(),
  query('tipo').optional().isIn(Object.values($Enums.TipoCliente))
    .withMessage(`Tipo de cliente inválido. Use ${Object.values($Enums.TipoCliente).join(' ou ')}.`),
  query('ativo').optional().isBoolean({ strict: false }).toBoolean().withMessage('Valor para "ativo" deve ser booleano.'),
  query('search').optional().isString().trim().escape(),
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Usando 'queryParamsFromValidation' para clareza que vem de matchedData
      const queryParamsFromValidation = matchedData(req, { locations: ['query'] });

      // Assumindo que ClienteFilters em clienteDtos.ts tem todos os campos como opcionais (prop?: Tipo)
      const filters: ClienteFilters = {
        nome: queryParamsFromValidation.nome,
        tipo: queryParamsFromValidation.tipo as PrismaTipoCliente, // Cast após validação isIn
        ativo: queryParamsFromValidation.ativo,
        search: queryParamsFromValidation.search,
        email: queryParamsFromValidation.email,
      };
      const pagination: PaginationOptions = {
        page: queryParamsFromValidation.page,
        limit: queryParamsFromValidation.limit,
        sortBy: queryParamsFromValidation.sortBy,
        sortOrder: queryParamsFromValidation.sortOrder, // CORRIGIDO: Usando queryParamsFromValidation
      };

      const result = await clienteService.getAllClientes(filters, pagination);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
];

export const show = [
  param('id').isInt({ min: 1 }).toInt().withMessage('ID inválido ou não fornecido.'),
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 'id' aqui é garantido como number pelo .toInt() e pela validação
      const { id } = matchedData(req, { locations: ['params'] }) as { id: number };
      const cliente = await clienteService.getClienteById(id);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  },
];

export const create = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 3, max: 100 }).escape(),
  body('tipo').isIn(Object.values($Enums.TipoCliente)).withMessage(`Tipo deve ser um dos seguintes: ${Object.values($Enums.TipoCliente).join(', ')}.`),
  // CORRIGIDO: Se cnpjCpf é obrigatório em CreateClienteDTO, a validação deve refletir isso.
  // Se for opcional no DTO, mantenha .optional().
  // Vou assumir que é obrigatório conforme o erro TS2741.
  body('cnpjCpf').trim().notEmpty().withMessage('CNPJ/CPF é obrigatório.')
    .isString().withMessage('CNPJ/CPF deve ser string.')
    .custom((value, { req }) => {
        const tipo = req.body.tipo as $Enums.TipoCliente; // O tipo já foi validado para ser do enum
        const cleanValue = String(value).replace(/\D/g, '');
        if (tipo === $Enums.TipoCliente.PF && !cpf.isValid(cleanValue)) {
            throw new Error('CPF fornecido é inválido.');
        }
        if (tipo === $Enums.TipoCliente.PJ && !cnpj.isValid(cleanValue)) {
            throw new Error('CNPJ fornecido é inválido.');
        }
        return true;
    }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').toLowerCase().normalizeEmail(),
  body('telefone').optional({ checkFalsy: true }).isString().trim().escape(),
  body('endereco').optional({ checkFalsy: true }).isString().trim().escape(),
  body('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano.'),
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawValidatedData = matchedData(req, { locations: ['body'] });
      
      // CORRIGIDO: Garante que todos os campos de CreateClienteDTO são preenchidos
      // (os opcionais podem vir como undefined de matchedData se não enviados)
      const validatedData: CreateClienteDTO = {
        nome: rawValidatedData.nome,       // Obrigatório pela validação
        tipo: rawValidatedData.tipo as PrismaTipoCliente, // Obrigatório pela validação
        cnpjCpf: rawValidatedData.cnpjCpf, // Obrigatório pela validação (conforme correção acima)
        email: rawValidatedData.email,     // Opcional
        telefone: rawValidatedData.telefone,
        endereco: rawValidatedData.endereco,
        ativo: rawValidatedData.ativo,     // Opcional
      };
      
      const cliente = await clienteService.createCliente(validatedData);
      res.status(201).json(cliente);
    } catch (error) {
      next(error);
    }
  },
];

export const update = [
  param('id').isInt({ min: 1 }).toInt().withMessage('ID inválido ou não fornecido.'),
  body('nome').optional().trim().notEmpty({ignore_whitespace:true}).withMessage('Nome não pode ser apenas espaços se fornecido.').isLength({ min: 3, max: 100 }).escape(),
  body('tipo').optional().isIn(Object.values($Enums.TipoCliente)).withMessage(`Tipo deve ser um dos seguintes: ${Object.values($Enums.TipoCliente).join(', ')}.`),
  // Validação para CNPJ/CPF no update (semelhante ao create, mas opcional)
  body('cnpjCpf').optional({ checkFalsy: true }).isString().trim()
    .custom((value, { req }) => {
        // Se está atualizando cnpjCpf, o tipo também deve ser fornecido ou validado contra o tipo existente.
        // Esta validação customizada pode precisar ser mais complexa se 'tipo' não for fornecido no DTO de update.
        // Por simplicidade, se cnpjCpf for fornecido, idealmente o tipo também seria, ou o tipo atual do cliente seria usado.
        const tipoParaValidar = req.body.tipo || (req as any).clienteExistente?.tipo; // Exemplo: necessitaria buscar cliente antes
        if (value && tipoParaValidar) {
            const cleanValue = String(value).replace(/\D/g, '');
            if (tipoParaValidar === $Enums.TipoCliente.PF && !cpf.isValid(cleanValue)) throw new Error('CPF fornecido é inválido.');
            if (tipoParaValidar === $Enums.TipoCliente.PJ && !cnpj.isValid(cleanValue)) throw new Error('CNPJ fornecido é inválido.');
        }
        return true;
    }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').toLowerCase().normalizeEmail(),
  body('telefone').optional({ checkFalsy: true }).isString().trim().escape(),
  body('endereco').optional({ checkFalsy: true }).isString().trim().escape(),
  body('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano.'),
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = matchedData(req, { locations: ['params'] }) as { id: number };
      const rawValidatedData = matchedData(req, { locations: ['body'] });
      
      if (Object.keys(rawValidatedData).length === 0) {
        res.status(304).send();
        return;
      }

      // Mapeamento para UpdateClienteDTO, garantindo tipos corretos
      const validatedData: UpdateClienteDTO = {
          ...rawValidatedData,
          // Se 'tipo' estiver presente em rawValidatedData, faça o cast
          // E se UpdateClienteDTO.tipo for opcional, está ok.
          ...(rawValidatedData.tipo && { tipo: rawValidatedData.tipo as PrismaTipoCliente })
      };
      
      const cliente = await clienteService.updateCliente(id, validatedData);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  },
];

export const remove = [
  param('id').isInt({ min: 1 }).toInt().withMessage('ID inválido ou não fornecido.'),
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = matchedData(req, { locations: ['params'] }) as { id: number };
      await clienteService.deleteCliente(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
];