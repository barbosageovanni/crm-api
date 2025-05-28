// clienteController.ts - Versão melhorada
import { Request, Response, NextFunction } from 'express';
import * as service from '../services/clienteService';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      nome: req.query.nome as string,
      tipo: req.query.tipo as string,
      ativo: req.query.ativo ? req.query.ativo === 'true' : undefined,
      search: req.query.search as string,
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await service.getAllClientes(filters, pagination);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const show = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID inválido', 400);
    
    const cliente = await service.getClienteById(id);
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cliente = await service.createCliente(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID inválido', 400);
    
    const cliente = await service.updateCliente(id, req.body);
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID inválido', 400);
    
    await service.deleteCliente(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};