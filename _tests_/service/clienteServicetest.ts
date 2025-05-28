import { PrismaClient } from '@prisma/client';
import * as clienteService from '../../src/services/clienteService';
import { CreateClienteDTO, UpdateClienteDTO } from '../../src/dtos/clienteDtos';
import { NotFoundError, ValidationError, DuplicateError } from '../../src/errors/AppError';

// Mock do módulo
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('ClienteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllClientes', () => {
    it('deve retornar lista paginada de clientes', async () => {
      const mockClientes = [
        {
          id: 1,
          nome: 'Cliente Teste',
          cnpjCpf: '12345678901',
          tipo: 'PF',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.cliente.findMany.mockResolvedValue(mockClientes);
      mockPrisma.cliente.count.mockResolvedValue(1);

      const result = await clienteService.getAllClientes();

      expect(result.data).toEqual(mockClientes);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(mockPrisma.cliente.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('deve aplicar filtros corretamente', async () => {
      const filters = {
        nome: 'João',
        tipo: 'PF',
        ativo: true,
      };

      mockPrisma.cliente.findMany.mockResolvedValue([]);
      mockPrisma.cliente.count.mockResolvedValue(0);

      await clienteService.getAllClientes(filters);

      expect(mockPrisma.cliente.findMany).toHaveBeenCalledWith({
        where: {
          nome: { contains: 'João', mode: 'insensitive' },
          tipo: 'PF',
          ativo: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('deve tratar erros adequadamente', async () => {
      const error = new Error('Database error');
      mockPrisma.cliente.findMany.mockRejectedValue(error);

      await expect(clienteService.getAllClientes()).rejects.toThrow(error);
    });
  });

  describe('getClienteById', () => {
    it('deve retornar cliente quando encontrado', async () => {
      const mockCliente = {
        id: 1,
        nome: 'Cliente Teste',
        cnpjCpf: '12345678901',
        tipo: 'PF',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.cliente.findUnique.mockResolvedValue(mockCliente);

      const result = await clienteService.getClienteById(1);

      expect(result).toEqual(mockCliente);
      expect(mockPrisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve lançar NotFoundError quando cliente não existe', async () => {
      mockPrisma.cliente.findUnique.mockResolvedValue(null);

      await expect(clienteService.getClienteById(1))
        .rejects.toThrow(NotFoundError);
    });

    it('deve lançar ValidationError para ID inválido', async () => {
      await expect(clienteService.getClienteById(0))
        .rejects.toThrow(ValidationError);
      
      await expect(clienteService.getClienteById(-1))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('createCliente', () => {
    it('deve criar cliente com dados válidos', async () => {
      const createData: CreateClienteDTO = {
        nome: 'João Silva',
        cnpjCpf: '12345678901',
        tipo: 'PF',
        email: 'joao@email.com',
      };

      const mockCreatedCliente = {
        id: 1,
        ...createData,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.cliente.findFirst.mockResolvedValue(null); // Não existe duplicata
      mockPrisma.cliente.create.mockResolvedValue(mockCreatedCliente);

      const result = await clienteService.createCliente(createData);

      expect(result).toEqual(mockCreatedCliente);
      expect(mockPrisma.cliente.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nome: 'João Silva',
          cnpjCpf: '12345678901',
          tipo: 'PF',
          email: 'joao@email.com',
        }),
      });
    });

    it('deve lançar ValidationError para dados inválidos', async () => {
      const invalidData = {
        nome: '',
        tipo: 'INVALID',
      } as CreateClienteDTO;

      await expect(clienteService.createCliente(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('deve lançar DuplicateError para CPF/CNPJ já existente', async () => {
      const createData: CreateClienteDTO = {
        nome: 'João Silva',
        cnpjCpf: '12345678901',
        tipo: 'PF',
      };

      const existingCliente = {
        id: 2,
        nome: 'Outro Cliente',
        cnpjCpf: '12345678901',
        tipo: 'PF',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.cliente.findFirst.mockResolvedValue(existingCliente);

      await expect(clienteService.createCliente(createData))
        .rejects.toThrow(DuplicateError);
    });
  });

  describe('updateCliente', () => {
    it('deve atualizar cliente existente', async () => {
      const updateData: UpdateClienteDTO = {
        nome: 'João Silva Atualizado',
        email: 'joao.novo@email.com',
      };

      const existingCliente = {
        id: 1,
        nome: 'João Silva',
        cnpjCpf: '12345678901',
        tipo: 'PF',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCliente = {
        ...existingCliente,
        ...updateData,
        updatedAt: new Date(),
      };

      mockPrisma.cliente.findUnique.mockResolvedValue(existingCliente);
      mockPrisma.cliente.update.mockResolvedValue(updatedCliente);

      const result = await clienteService.updateCliente(1, updateData);

      expect(result).toEqual(updatedCliente);
      expect(mockPrisma.cliente.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          nome: 'João Silva Atualizado',
          email: 'joao.novo@email.com',
          updatedAt: expect.any(Date),
        }),
      });
    });

    it('deve lançar NotFoundError para cliente inexistente', async () => {
      mockPrisma.cliente.findUnique.mockResolvedValue(null);

      await expect(clienteService.updateCliente(999, { nome: 'Teste' }))
        .rejects.toThrow(NotFoundError);
    });
  });
});