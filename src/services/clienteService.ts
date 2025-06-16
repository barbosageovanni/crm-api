// src/services/clienteService.ts

import { PrismaClient, $Enums } from '@prisma/client';
import { CreateClienteDTO, UpdateClienteDTO, ClienteFilters, PaginationOptions, PaginatedClienteResponse, ClienteResponseDTO } from '../dtos/clienteDtos';
import { AppError } from '../middlewares/AppError';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Type alias para clareza
type PrismaTipoCliente = $Enums.TipoCliente;

export class ClienteService {
  async getAllClientes(filters: ClienteFilters = {}, pagination: PaginationOptions = {}): Promise<PaginatedClienteResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'nome',
        sortOrder = 'asc'
      } = pagination;

      const {
        nome,
        tipo,
        ativo,
        search,
        email
      } = filters;

      // Construir condições de filtro
      const where: any = {};

      if (nome) {
        where.nome = {
          contains: nome,
          mode: 'insensitive'
        };
      }

      if (tipo) {
        where.tipo = tipo;
      }

      if (typeof ativo === 'boolean') {
        where.ativo = ativo;
      }

      if (email) {
        where.email = {
          contains: email,
          mode: 'insensitive'
        };
      }

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { cnpjCpf: { contains: search } }
        ];
      }

      // Calcular offset para paginação
      const offset = (page - 1) * limit;

      // Buscar clientes
      const [clientes, total] = await Promise.all([
        prisma.cliente.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: offset,
          take: limit
        }),
        prisma.cliente.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      // Mapear para DTO de resposta
      const clientesFormatted: ClienteResponseDTO[] = clientes.map(cliente => ({
        id: cliente.id,
        nome: cliente.nome,
        tipo: cliente.tipo,
        cnpjCpf: cliente.cnpjCpf,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        ativo: cliente.ativo,
        createdAt: cliente.createdAt,
        updatedAt: cliente.updatedAt
      }));

      logger.info('Clientes listados com sucesso', {
        total,
        page,
        limit,
        totalPages,
        filters
      });

      return {
        data: clientesFormatted,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Erro ao listar clientes', { 
        error: error instanceof Error ? error.message : error, 
        filters 
      });
      throw new AppError('Erro interno do servidor ao listar clientes.', 500);
    }
  }

  async getClienteById(id: number): Promise<ClienteResponseDTO> {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id }
      });

      if (!cliente) {
        throw new AppError('Cliente não encontrado.', 404);
      }

      logger.info('Cliente encontrado com sucesso', { clienteId: id });
      
      return {
        id: cliente.id,
        nome: cliente.nome,
        tipo: cliente.tipo,
        cnpjCpf: cliente.cnpjCpf,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        ativo: cliente.ativo,
        createdAt: cliente.createdAt,
        updatedAt: cliente.updatedAt
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erro ao buscar cliente por ID', { 
        error: error instanceof Error ? error.message : error, 
        clienteId: id 
      });
      throw new AppError('Erro interno do servidor ao buscar cliente.', 500);
    }
  }

  async createCliente(data: CreateClienteDTO): Promise<ClienteResponseDTO> {
    try {
      // Verificar se já existe cliente com mesmo CNPJ/CPF (se fornecido)
      if (data.cnpjCpf) {
        const existingCliente = await prisma.cliente.findUnique({
          where: { cnpjCpf: data.cnpjCpf }
        });

        if (existingCliente) {
          throw new AppError('Já existe um cliente cadastrado com este CNPJ/CPF.', 409);
        }
      }

      // Verificar se já existe cliente com mesmo email (se fornecido)
      if (data.email) {
        const existingEmail = await prisma.cliente.findUnique({
          where: { email: data.email }
        });

        if (existingEmail) {
          throw new AppError('Já existe um cliente cadastrado com este email.', 409);
        }
      }

      const cliente = await prisma.cliente.create({
        data: {
          nome: data.nome,
          tipo: data.tipo,
          cnpjCpf: data.cnpjCpf || null,
          email: data.email || null,
          telefone: data.telefone || null,
          endereco: data.endereco || null,
          ativo: data.ativo ?? true
        }
      });

      logger.info('Cliente criado com sucesso', { 
        clienteId: cliente.id, 
        nome: cliente.nome 
      });
      
      return {
        id: cliente.id,
        nome: cliente.nome,
        tipo: cliente.tipo,
        cnpjCpf: cliente.cnpjCpf,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        ativo: cliente.ativo,
        createdAt: cliente.createdAt,
        updatedAt: cliente.updatedAt
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erro ao criar cliente', { 
        error: error instanceof Error ? error.message : error, 
        data 
      });
      throw new AppError('Erro interno do servidor ao criar cliente.', 500);
    }
  }

  async updateCliente(id: number, data: UpdateClienteDTO): Promise<ClienteResponseDTO> {
    try {
      // Verificar se o cliente existe
      const existingCliente = await prisma.cliente.findUnique({
        where: { id }
      });

      if (!existingCliente) {
        throw new AppError('Cliente não encontrado.', 404);
      }

      // Verificar conflitos de CNPJ/CPF se fornecido
      if (data.cnpjCpf && data.cnpjCpf !== existingCliente.cnpjCpf) {
        const existingCnpjCpf = await prisma.cliente.findUnique({
          where: { cnpjCpf: data.cnpjCpf }
        });

        if (existingCnpjCpf) {
          throw new AppError('Já existe um cliente cadastrado com este CNPJ/CPF.', 409);
        }
      }

      // Verificar conflitos de email se fornecido
      if (data.email && data.email !== existingCliente.email) {
        const existingEmail = await prisma.cliente.findUnique({
          where: { email: data.email }
        });

        if (existingEmail) {
          throw new AppError('Já existe um cliente cadastrado com este email.', 409);
        }
      }

      const cliente = await prisma.cliente.update({
        where: { id },
        data: {
          ...(data.nome !== undefined && { nome: data.nome }),
          ...(data.tipo !== undefined && { tipo: data.tipo }),
          ...(data.cnpjCpf !== undefined && { cnpjCpf: data.cnpjCpf }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.telefone !== undefined && { telefone: data.telefone }),
          ...(data.endereco !== undefined && { endereco: data.endereco }),
          ...(data.ativo !== undefined && { ativo: data.ativo })
        }
      });

      logger.info('Cliente atualizado com sucesso', { 
        clienteId: id, 
        nome: cliente.nome 
      });
      
      return {
        id: cliente.id,
        nome: cliente.nome,
        tipo: cliente.tipo,
        cnpjCpf: cliente.cnpjCpf,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        ativo: cliente.ativo,
        createdAt: cliente.createdAt,
        updatedAt: cliente.updatedAt
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erro ao atualizar cliente', { 
        error: error instanceof Error ? error.message : error, 
        clienteId: id, 
        data 
      });
      throw new AppError('Erro interno do servidor ao atualizar cliente.', 500);
    }
  }

  async deleteCliente(id: number): Promise<void> {
    try {
      // Verificar se o cliente existe
      const existingCliente = await prisma.cliente.findUnique({
        where: { id }
      });

      if (!existingCliente) {
        throw new AppError('Cliente não encontrado.', 404);
      }

      // Soft delete - apenas desativar o cliente ao invés de deletar
      await prisma.cliente.update({
        where: { id },
        data: { ativo: false }
      });

      logger.info('Cliente desativado com sucesso', { 
        clienteId: id, 
        nome: existingCliente.nome 
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erro ao deletar cliente', { 
        error: error instanceof Error ? error.message : error, 
        clienteId: id 
      });
      throw new AppError('Erro interno do servidor ao deletar cliente.', 500);
    }
  }
}

// Instanciar e exportar o service
export const clienteService = new ClienteService();