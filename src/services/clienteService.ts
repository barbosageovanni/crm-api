// clienteService.ts - Versão corrigida
import { PrismaClient, Cliente, Prisma } from '@prisma/client';
import { CreateClienteDTO, UpdateClienteDTO, ClienteFilters, PaginationOptions } from '../dtos/clienteDtos';
import { NotFoundError, ValidationError, DuplicateError } from '../errors/AppError';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { logger } from '../utils/logger';

class ClienteService {
  constructor(private prisma: PrismaClient) {}

  async getAllClientes(filters?: ClienteFilters, pagination?: PaginationOptions) {
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.min(pagination?.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(pagination);

    try {
      const [clientes, total] = await Promise.all([
        this.prisma.cliente.findMany({ where, orderBy, skip, take: limit }),
        this.prisma.cliente.count({ where })
      ]);

      return {
        data: clientes,
        pagination: {
          page, limit, total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Erro ao listar clientes', { error, filters, pagination });
      throw error;
    }
  }

  async getClienteById(id: number): Promise<Cliente> {
    if (!id || id <= 0) throw new ValidationError('ID inválido');

    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundError('Cliente', id);

    return cliente;
  }

  async createCliente(data: CreateClienteDTO): Promise<Cliente> {
    await this.validateClienteData(data);
    
    if (data.cnpjCpf) {
      await this.checkDuplicateCnpjCpf(data.cnpjCpf);
    }

    const cleanData = this.sanitizeData(data);
    
    try {
      const cliente = await this.prisma.cliente.create({ data: cleanData });
      logger.info('Cliente criado', { clienteId: cliente.id });
      return cliente;
    } catch (error) {
      logger.error('Erro ao criar cliente', { error, data });
      throw error;
    }
  }

  async updateCliente(id: number, data: UpdateClienteDTO): Promise<Cliente> {
    await this.getClienteById(id); // Verifica se existe
    
    if (data.cnpjCpf) {
      await this.validateCnpjCpf(data.cnpjCpf, data.tipo);
      await this.checkDuplicateCnpjCpf(data.cnpjCpf, id);
    }

    const cleanData = this.sanitizeUpdateData(data);
    
    try {
      const cliente = await this.prisma.cliente.update({
        where: { id },
        data: { ...cleanData, updatedAt: new Date() }
      });
      
      logger.info('Cliente atualizado', { clienteId: id });
      return cliente;
    } catch (error) {
      logger.error('Erro ao atualizar cliente', { error, id, data });
      throw error;
    }
  }

  async deleteCliente(id: number): Promise<void> {
    await this.getClienteById(id);
    
    try {
      await this.prisma.cliente.delete({ where: { id } });
      logger.info('Cliente deletado', { clienteId: id });
    } catch (error) {
      logger.error('Erro ao deletar cliente', { error, id });
      throw error;
    }
  }

  private validateCnpjCpf(cnpjCpfValue: string, tipo?: string): void {
    const cleanValue = cnpjCpfValue.replace(/\D/g, '');
    
    if (tipo === 'PF' && !cpf.isValid(cleanValue)) {
      throw new ValidationError('CPF inválido');
    }
    if (tipo === 'PJ' && !cnpj.isValid(cleanValue)) {
      throw new ValidationError('CNPJ inválido');
    }
    if (!tipo && !(cpf.isValid(cleanValue) || cnpj.isValid(cleanValue))) {
      throw new ValidationError('CPF/CNPJ inválido');
    }
  }

  private async validateClienteData(data: CreateClienteDTO): Promise<void> {
    if (!data.nome?.trim()) throw new ValidationError('Nome é obrigatório');
    if (!data.tipo) throw new ValidationError('Tipo é obrigatório');
    if (!['PF', 'PJ'].includes(data.tipo)) throw new ValidationError('Tipo deve ser PF ou PJ');
    
    if (data.cnpjCpf) {
      this.validateCnpjCpf(data.cnpjCpf, data.tipo);
    }
    
    if (data.email && !this.isValidEmail(data.email)) {
      throw new ValidationError('Email inválido');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private sanitizeData(data: CreateClienteDTO): any {
    return {
      nome: data.nome.trim(),
      cnpjCpf: data.cnpjCpf?.replace(/\D/g, '') || null,
      tipo: data.tipo,
      email: data.email?.toLowerCase().trim() || null,
      telefone: data.telefone?.replace(/\D/g, '') || null,
      endereco: data.endereco?.trim() || null,
    };
  }

  private sanitizeUpdateData(data: UpdateClienteDTO): any {
    const result: any = {};
    
    if (data.nome) result.nome = data.nome.trim();
    if (data.cnpjCpf) result.cnpjCpf = data.cnpjCpf.replace(/\D/g, '');
    if (data.tipo) result.tipo = data.tipo;
    if (data.email) result.email = data.email.toLowerCase().trim();
    if (data.telefone) result.telefone = data.telefone.replace(/\D/g, '');
    if (data.endereco) result.endereco = data.endereco.trim();
    if (data.ativo !== undefined) result.ativo = data.ativo;
    
    return result;
  }

  private async checkDuplicateCnpjCpf(cnpjCpf: string, excludeId?: number): Promise<void> {
    const cleanCnpjCpf = cnpjCpf.replace(/\D/g, '');
    
    const existing = await this.prisma.cliente.findFirst({
      where: {
        cnpjCpf: cleanCnpjCpf,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (existing) {
      throw new DuplicateError('CPF/CNPJ', cnpjCpf);
    }
  }

  private buildWhereClause(filters?: ClienteFilters): Prisma.ClienteWhereInput {
    if (!filters) return {};

    const where: Prisma.ClienteWhereInput = {};
    
    if (filters.nome) where.nome = { contains: filters.nome, mode: 'insensitive' };
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.ativo !== undefined) where.ativo = filters.ativo;
    
    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { cnpjCpf: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return where;
  }

  private buildOrderBy(pagination?: PaginationOptions): Prisma.ClienteOrderByWithRelationInput {
    if (!pagination?.sortBy) return { createdAt: 'desc' };
    
    return {
      [pagination.sortBy]: pagination.sortOrder || 'asc'
    };
  }
}

// Singleton instance
const prisma = new PrismaClient();
const clienteService = new ClienteService(prisma);

export const getAllClientes = clienteService.getAllClientes.bind(clienteService);
export const getClienteById = clienteService.getClienteById.bind(clienteService);
export const createCliente = clienteService.createCliente.bind(clienteService);
export const updateCliente = clienteService.updateCliente.bind(clienteService);
export const deleteCliente = clienteService.deleteCliente.bind(clienteService);