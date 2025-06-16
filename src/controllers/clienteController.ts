// src/controllers/clienteController.ts
import { Request, Response, NextFunction } from 'express';
import { clienteService } from '../services/clienteService';
import { CreateClienteDTO, UpdateClienteDTO, ClienteFilters, PaginationOptions } from '../dtos/clienteDtos';
import { AppError } from '../middlewares/AppError';
import { logger } from '../utils/logger';

// Listar clientes com filtros e paginação
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'nome',
      sortOrder = 'asc',
      nome,
      tipo,
      ativo,
      search,
      email
    } = req.query;

    // Validar e converter parâmetros de paginação
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    if (isNaN(pageNumber) || pageNumber < 1) {
      throw new AppError('Parâmetro "page" deve ser um número maior que 0', 400);
    }

    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
      throw new AppError('Parâmetro "limit" deve ser um número entre 1 e 100', 400);
    }

    // Construir filtros
    const filters: ClienteFilters = {};
    if (nome) filters.nome = nome as string;
    if (tipo) filters.tipo = tipo as 'PF' | 'PJ';
    if (email) filters.email = email as string;
    if (search) filters.search = search as string;
    if (ativo !== undefined) {
      if (ativo === 'true') filters.ativo = true;
      else if (ativo === 'false') filters.ativo = false;
    }

    // Opções de paginação
    const pagination: PaginationOptions = {
      page: pageNumber,
      limit: limitNumber,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await clienteService.getAllClientes(filters, pagination);

    logger.info('Listagem de clientes executada com sucesso', {
      total: result.pagination.total,
      page: pageNumber,
      limit: limitNumber,
      userId: (req as any).user?.id
    });

    res.status(200).json({
      success: true,
      message: 'Clientes listados com sucesso',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Buscar cliente por ID
export const show = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente deve ser um número válido', 400);
    }

    const cliente = await clienteService.getClienteById(clienteId);

    logger.info('Cliente encontrado com sucesso', {
      clienteId,
      userId: (req as any).user?.id
    });

    res.status(200).json({
      success: true,
      message: 'Cliente encontrado com sucesso',
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

// Criar novo cliente
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clienteData: CreateClienteDTO = req.body;

    // Validações adicionais se necessário
    if (!clienteData.nome || clienteData.nome.trim().length === 0) {
      throw new AppError('Nome do cliente é obrigatório', 400);
    }

    if (!clienteData.tipo || !['PF', 'PJ'].includes(clienteData.tipo)) {
      throw new AppError('Tipo do cliente deve ser PF ou PJ', 400);
    }

    const novoCliente = await clienteService.createCliente(clienteData);

    logger.info('Cliente criado com sucesso', {
      clienteId: novoCliente.id,
      nome: novoCliente.nome,
      userId: (req as any).user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Cliente criado com sucesso',
      data: novoCliente
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar cliente
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente deve ser um número válido', 400);
    }

    const updateData: UpdateClienteDTO = req.body;

    // Validações adicionais
    if (updateData.nome !== undefined && updateData.nome.trim().length === 0) {
      throw new AppError('Nome do cliente não pode estar vazio', 400);
    }

    if (updateData.tipo !== undefined && !['PF', 'PJ'].includes(updateData.tipo)) {
      throw new AppError('Tipo do cliente deve ser PF ou PJ', 400);
    }

    const clienteAtualizado = await clienteService.updateCliente(clienteId, updateData);

    logger.info('Cliente atualizado com sucesso', {
      clienteId,
      nome: clienteAtualizado.nome,
      userId: (req as any).user?.id
    });

    res.status(200).json({
      success: true,
      message: 'Cliente atualizado com sucesso',
      data: clienteAtualizado
    });
  } catch (error) {
    next(error);
  }
};

// Remover cliente (soft delete)
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente deve ser um número válido', 400);
    }

    await clienteService.deleteCliente(clienteId);

    logger.info('Cliente removido com sucesso', {
      clienteId,
      userId: (req as any).user?.id
    });

    res.status(200).json({
      success: true,
      message: 'Cliente removido com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Buscar clientes ativos (endpoint adicional útil)
export const listActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '50' } = req.query;
    
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 50;

    const filters: ClienteFilters = { ativo: true };
    const pagination: PaginationOptions = {
      page: pageNumber,
      limit: limitNumber,
      sortBy: 'nome',
      sortOrder: 'asc'
    };

    const result = await clienteService.getAllClientes(filters, pagination);

    res.status(200).json({
      success: true,
      message: 'Clientes ativos listados com sucesso',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};