// src/services/transporteService.ts
import { PrismaClient, Transporte } from '@prisma/client';
import { CreateTransporteDTO, UpdateTransporteDTO, TransporteFilters, PaginationOptions } from '../dtos/transporteDtos';
import { AppError, NotFoundError } from '../middlewares/AppError';
import { logger } from '../utils/logger';

class TransporteService {
  constructor(private prisma: PrismaClient) {}

  // Converter datas de string para Date
  private parseTransporteDates(data: any): any {
    const result = { ...data };
    
    // Converter campos de data de string ISO para Date
    const dateFields = [
      'dataOperacao', 
      'dataEnvioFaturamento', 
      'dataVencimento', 
      'dataAtesto', 
      'dataNotaFiscal'
    ];
    
    for (const field of dateFields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = new Date(result[field]);
      }
    }
    
    return result;
  }

  // Converter datas de Date para string ISO
  private formatTransporteResponse(transporte: Transporte): any {
    const result = { ...transporte };
    
    // Converter campos de data de Date para string ISO
    const dateFields = [
      'dataOperacao', 
      'dataEnvioFaturamento', 
      'dataVencimento', 
      'dataAtesto', 
      'dataNotaFiscal',
      'createdAt',
      'updatedAt'
    ];
    
    for (const field of dateFields) {
      if (result[field] instanceof Date) {
        result[field] = result[field].toISOString();
      }
    }
    
    return result;
  }

  // Listar transportes com filtros e paginação
  async getAllTransportes(filters: TransporteFilters = {}, pagination: PaginationOptions = {}) {
    try {
      const { clienteId, search, dateFrom, dateTo } = filters;
      const { page = 1, limit = 10, sortBy = 'dataOperacao', sortOrder = 'desc' } = pagination;
      
      const skip = (page - 1) * limit;
      
      // Construir filtros
      const where: any = {};
      
      if (clienteId) {
        where.clienteId = clienteId;
      }
      
      if (search) {
        where.OR = [
          { numeroCteOc: { contains: search, mode: 'insensitive' } },
          { descricaoNotaFiscal: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      // Filtro de data
      if (dateFrom || dateTo) {
        where.dataOperacao = {};
        
        if (dateFrom) {
          where.dataOperacao.gte = new Date(dateFrom);
        }
        
        if (dateTo) {
          where.dataOperacao.lte = new Date(dateTo);
        }
      }
      
      // Consulta para contar total de registros
      const totalCount = await this.prisma.transporte.count({ where });
      
      // Consulta principal com paginação e ordenação
      const transportes = await this.prisma.transporte.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              cnpjCpf: true,
              tipo: true
            }
          }
        }
      });
      
      // Formatar resposta
      const formattedTransportes = transportes.map(transporte => this.formatTransporteResponse(transporte));
      
      return {
        data: formattedTransportes,
        pagination: {
          page,
          limit,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      logger.error('Erro ao listar transportes:', { error });
      throw new AppError('Erro ao listar transportes.', 500);
    }
  }

  // Obter transporte por ID
  async getTransporteById(id: number) {
    try {
      const transporte = await this.prisma.transporte.findUnique({
        where: { id },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              cnpjCpf: true,
              tipo: true
            }
          }
        }
      });
      
      if (!transporte) {
        throw new NotFoundError('Transporte', id);
      }
      
      return this.formatTransporteResponse(transporte);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Erro ao buscar transporte por ID:', { error, id });
      throw new AppError(`Erro ao buscar transporte com ID ${id}.`, 500);
    }
  }

  // Criar novo transporte
  async createTransporte(data: CreateTransporteDTO) {
    try {
      // Verificar se o cliente existe
      const clienteExists = await this.prisma.cliente.findUnique({
        where: { id: data.clienteId }
      });
      
      if (!clienteExists) {
        throw new NotFoundError('Cliente', data.clienteId);
      }
      
      // Converter datas de string para Date
      const parsedData = this.parseTransporteDates(data);
      
      // Criar transporte
      const transporte = await this.prisma.transporte.create({
        data: parsedData,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              cnpjCpf: true,
              tipo: true
            }
          }
        }
      });
      
      logger.info('Transporte criado com sucesso', { transporteId: transporte.id });
      return this.formatTransporteResponse(transporte);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Erro ao criar transporte:', { error, data });
      throw new AppError('Erro ao criar transporte.', 500);
    }
  }

  // Atualizar transporte
  async updateTransporte(id: number, data: UpdateTransporteDTO) {
    try {
      // Verificar se o transporte existe
      const transporteExists = await this.prisma.transporte.findUnique({
        where: { id }
      });
      
      if (!transporteExists) {
        throw new NotFoundError('Transporte', id);
      }
      
      // Converter datas de string para Date
      const parsedData = this.parseTransporteDates(data);
      
      // Atualizar transporte
      const transporte = await this.prisma.transporte.update({
        where: { id },
        data: parsedData,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              cnpjCpf: true,
              tipo: true
            }
          }
        }
      });
      
      logger.info('Transporte atualizado com sucesso', { transporteId: id });
      return this.formatTransporteResponse(transporte);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Erro ao atualizar transporte:', { error, id, data });
      throw new AppError(`Erro ao atualizar transporte com ID ${id}.`, 500);
    }
  }

  // Excluir transporte
  async deleteTransporte(id: number) {
    try {
      // Verificar se o transporte existe
      const transporteExists = await this.prisma.transporte.findUnique({
        where: { id }
      });
      
      if (!transporteExists) {
        throw new NotFoundError('Transporte', id);
      }
      
      // Excluir transporte
      await this.prisma.transporte.delete({
        where: { id }
      });
      
      logger.info('Transporte excluído com sucesso', { transporteId: id });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Erro ao excluir transporte:', { error, id });
      throw new AppError(`Erro ao excluir transporte com ID ${id}.`, 500);
    }
  }
}

import prisma from '../prisma/client';
const transporteServiceInstance = new TransporteService(prisma);
export const transporteService = transporteServiceInstance;
