// src/services/__tests__/clienteService.test.ts

import { Cliente as PrismaClienteType, $Enums, Prisma } from '@prisma/client';
import { CreateClienteDTO, UpdateClienteDTO, ClienteFilters, PaginationOptions } from '../../dtos/clienteDtos';
import { AppError, DuplicateError, ValidationError, NotFoundError } from '../../errors/AppError';
import { clienteService } from '../clienteService'; // Importa o objeto de serviço
import { CACHE_KEYS as ACTUAL_CACHE_KEYS, CACHE_TTL as ACTUAL_CACHE_TTL } from '../../config/redis';

// MOCKS
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), http: jest.fn() },
}));

// Mock para RedisService: Funções mock individuais definidas ANTES do jest.mock
const mockRedisGetFn = jest.fn();
const mockRedisSetFn = jest.fn();
const mockRedisDelFn = jest.fn();
const mockRedisIsHealthyFn = jest.fn(() => true);

jest.mock('../../config/redis', () => ({
  __esModule: true,
  redisService: {
    get: mockRedisGetFn,
    set: mockRedisSetFn,
    del: mockRedisDelFn,
    isHealthy: mockRedisIsHealthyFn,
  },
  CACHE_KEYS: ACTUAL_CACHE_KEYS,
  CACHE_TTL: ACTUAL_CACHE_TTL,
}));

// Mock para Prisma Client: Funções mock individuais definidas ANTES do jest.mock
const mockPrismaFnFindUnique = jest.fn();
const mockPrismaFnFindMany = jest.fn();
const mockPrismaFnFindFirst = jest.fn();
const mockPrismaFnCreate = jest.fn();
const mockPrismaFnUpdate = jest.fn();
const mockPrismaFnDelete = jest.fn();
const mockPrismaFnCount = jest.fn();
const mockPrismaFnTransaction = jest.fn();

jest.mock('../../prisma/client', () => ({
  __esModule: true,
  default: {
    cliente: {
      findUnique: mockPrismaFnFindUnique,
      findMany: mockPrismaFnFindMany,
      findFirst: mockPrismaFnFindFirst,
      create: mockPrismaFnCreate,
      update: mockPrismaFnUpdate,
      delete: mockPrismaFnDelete,
      count: mockPrismaFnCount,
    },
    $transaction: mockPrismaFnTransaction,
  },
}));

describe('ClienteService Unit Tests', () => {
  // Helper para criar mock de Cliente (tipo Prisma)
  const createMockCliente = (id: number, overrides: Partial<PrismaClienteType> = {}): PrismaClienteType => {
    const base: PrismaClienteType = {
      id,
      nome: `Cliente Teste ${id}`,
      cnpjCpf: id % 2 === 0 ? `CNPJ${id.toString().padStart(12, '0')}` : null,
      tipo: id % 2 === 0 ? $Enums.TipoCliente.PJ : $Enums.TipoCliente.PF,
      email: `cliente${id}@exemplo.com`, // Pode ser null no Prisma
      telefone: null,
      endereco: null,
      ativo: true,
      createdAt: new Date('2024-01-01T10:00:00.000Z'),
      updatedAt: new Date('2024-01-01T11:00:00.000Z'),
    };
    
    // Trata overrides: se uma propriedade em overrides for undefined, e no Prisma ela for T | null, usa null.
    const finalOverrides: Partial<PrismaClienteType> = {};
    for (const key in overrides) {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        const k = key as keyof PrismaClienteType;
        const value = overrides[k];
        if (value === undefined) {
          // Para campos string opcionais no schema (string | null), se DTO envia undefined, mapeia para null
          if (k === 'cnpjCpf' || k === 'email' || k === 'telefone' || k === 'endereco') {
            (finalOverrides as any)[k] = null;
          }
          // Não adiciona a propriedade se for undefined e não for um dos campos acima (usará o valor base)
        } else {
          (finalOverrides as any)[k] = value;
        }
      }
    }
    return { ...base, ...finalOverrides };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaFnFindUnique.mockReset();
    mockPrismaFnFindMany.mockReset();
    mockPrismaFnFindFirst.mockReset();
    mockPrismaFnCreate.mockReset();
    mockPrismaFnUpdate.mockReset();
    mockPrismaFnDelete.mockReset();
    mockPrismaFnCount.mockReset();
    mockPrismaFnTransaction.mockReset();
    mockRedisGetFn.mockReset().mockResolvedValue(null);
    mockRedisSetFn.mockReset().mockResolvedValue(true);
    mockRedisDelFn.mockReset().mockResolvedValue(1);
    mockRedisIsHealthyFn.mockReset().mockReturnValue(true);
  });

  describe('getAllClientes', () => {
    it('deve buscar do banco e salvar no cache (cache miss), sem filtros', async () => {
      const mockDbClientes = [createMockCliente(1)];
      const mockDbCount = 1;
      mockRedisGetFn.mockResolvedValue(null);
      
      // Configura o que as funções individuais que são chamadas DENTRO da transação devem retornar
      mockPrismaFnFindMany.mockResolvedValue(mockDbClientes);
      mockPrismaFnCount.mockResolvedValue(mockDbCount);
      // O mock da transação irá executar as promises reais (que são os mocks acima)
      mockPrismaFnTransaction.mockImplementation(async (prismaPromises: Prisma.PrismaPromise<any>[]) => {
        return Promise.all(prismaPromises);
      });

      const result = await clienteService.getAllClientes();
      expect(result.data).toEqual(mockDbClientes);
      expect(mockPrismaFnTransaction).toHaveBeenCalledTimes(1);
      // Verifica se os mocks individuais foram chamados (pela transação)
      expect(mockPrismaFnFindMany).toHaveBeenCalled();
      expect(mockPrismaFnCount).toHaveBeenCalled();
    });
  });

  describe('createCliente', () => {
    // CreateClienteDTO agora tem cnpjCpf e email como opcionais
    const createDtoBase: CreateClienteDTO = {
      nome: 'Empresa para Criar',
      tipo: $Enums.TipoCliente.PJ,
    };

    it('deve criar cliente com todos os campos opcionais fornecidos', async () => {
      const fullDto: CreateClienteDTO = {
        ...createDtoBase,
        cnpjCpf: '03.319.508/0001-45',
        email: 'criar.full@empresa.com',
        telefone: '1122334455',
        endereco: 'Rua Completa, 123',
        ativo: false,
      };
      const sanitizedCnpjCpf = fullDto.cnpjCpf?.replace(/\D/g, '') || null;
      const sanitizedEmail = fullDto.email?.toLowerCase().trim() || null;
      const sanitizedTelefone = fullDto.telefone?.replace(/\D/g, '') || null;

      const expectedSavedCliente = createMockCliente(1, {
        nome: fullDto.nome, tipo: fullDto.tipo, cnpjCpf: sanitizedCnpjCpf,
        email: sanitizedEmail, telefone: sanitizedTelefone, endereco: fullDto.endereco,
        ativo: fullDto.ativo,
      });
      mockPrismaFnFindFirst.mockResolvedValue(null); // Sem duplicidade de CNPJ/CPF
      mockPrismaFnCreate.mockResolvedValue(expectedSavedCliente);

      const result = await clienteService.createCliente(fullDto);
      expect(result).toEqual(expectedSavedCliente);
      expect(mockPrismaFnCreate).toHaveBeenCalledWith({
        data: {
          nome: fullDto.nome, tipo: fullDto.tipo, cnpjCpf: sanitizedCnpjCpf,
          email: sanitizedEmail, telefone: sanitizedTelefone, endereco: fullDto.endereco,
          ativo: false, // Passado pelo DTO
        },
      });
    });

    it('deve lançar DuplicateError se CNPJ/CPF já existir', async () => {
      const dtoComCnpj = { ...createDtoBase, cnpjCpf: '07.526.557/0001-00' }; // Garante que cnpjCpf é string
      const existingCliente = createMockCliente(3, { cnpjCpf: '07526557000100' });
      mockPrismaFnFindFirst.mockResolvedValue(existingCliente);

      await expect(clienteService.createCliente(dtoComCnpj)).rejects.toThrow(
        new DuplicateError('CPF/CNPJ', dtoComCnpj.cnpjCpf!)
      );
    });

    it('deve lançar DuplicateError se email já existir (P2002)', async () => {
      const dtoComEmail = { ...createDtoBase, email: 'existente@empresa.com' }; // Garante que email é string
      mockPrismaFnFindFirst.mockResolvedValue(null); // CNPJ não duplicado
      const prismaP2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed', { code: 'P2002', clientVersion: 'x.y.z', meta: { target: ['email'] } }
      );
      mockPrismaFnCreate.mockRejectedValue(prismaP2002Error);

      await expect(clienteService.createCliente(dtoComEmail)).rejects.toThrow(
        new DuplicateError('email', dtoComEmail.email!)
      );
    });
  });
  
  describe('getAllClientes (filtrado por tipo)', () => {
    it('deve filtrar clientes por tipo PJ', async () => {
        const clientesPJ = [createMockCliente(2, {tipo: $Enums.TipoCliente.PJ})];
        mockRedisGetFn.mockResolvedValue(null);
        mockPrismaFnFindMany.mockResolvedValue(clientesPJ);
        mockPrismaFnCount.mockResolvedValue(clientesPJ.length);
        // A transação usará os mocks acima
        mockPrismaFnTransaction.mockImplementation(async () => [await mockPrismaFnFindMany(), await mockPrismaFnCount()]);


        const result = await clienteService.getAllClientes({ tipo: $Enums.TipoCliente.PJ });
        
        expect(result.data.every((c: PrismaClienteType) => c.tipo === $Enums.TipoCliente.PJ)).toBe(true);
        expect(mockPrismaFnFindMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { tipo: { equals: $Enums.TipoCliente.PJ } }, // Verifica se o 'where' correto foi passado
        }));
    });
  });

  describe('updateCliente', () => {
    // UpdateClienteDTO tem 'tipo' opcional
    const updateDto: UpdateClienteDTO = { nome: 'Nome Atualizado XYZ Service' };
    it('deve atualizar cliente com sucesso', async () => {
      const clienteId = 1;
      const existingCliente = createMockCliente(clienteId);
      const updatedDataPayload = { nome: updateDto.nome }; // O que sanitizeUpdateData retornaria para este DTO
      const mockUpdatedCliente = { ...existingCliente, ...updatedDataPayload, updatedAt: new Date() };
      
      mockPrismaFnFindUnique.mockResolvedValue(existingCliente);
      mockPrismaFnFindFirst.mockResolvedValue(null); 
      mockPrismaFnUpdate.mockResolvedValue(mockUpdatedCliente);

      const result = await clienteService.updateCliente(clienteId, updateDto);
      expect(result.nome).toBe(updateDto.nome);
    });
  });
  
  describe('deleteCliente', () => {
    it('deve deletar cliente com sucesso (hard delete)', async () => {
      const clienteId = 1;
      const existingCliente = createMockCliente(clienteId);
      mockPrismaFnFindUnique.mockResolvedValue(existingCliente);
      mockPrismaFnDelete.mockResolvedValue(existingCliente);

      await clienteService.deleteCliente(clienteId);
      expect(mockPrismaFnDelete).toHaveBeenCalledWith({ where: { id: clienteId } });
    });
  });
});