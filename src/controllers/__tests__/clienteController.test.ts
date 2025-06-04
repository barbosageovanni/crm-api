// src/controllers/__tests__/clienteController.test.ts
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { Cliente, PapelUsuario, $Enums } from '@prisma/client'; // $Enums para TipoCliente
import { clienteService as ActualClienteService } from '../../services/clienteService';
import { CreateClienteDTO, UpdateClienteDTO } from '../../dtos/clienteDtos';
import { AppError, ValidationError as CustomValidationError } from '../../errors/AppError';

jest.mock('../../services/clienteService');
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), http: jest.fn() } }));
let mockAuthMiddlewareImplementation = (req: Request, res: Response, next: NextFunction) => { 
    (req as any).user = { userId: 1, email: 'test@test.com', papel: $Enums.PapelUsuario.USUARIO };
    next();
};
jest.mock('../../middlewares/authMiddleware', () => ({ 
    authMiddleware: (req: Request, res: Response, next: NextFunction) => mockAuthMiddlewareImplementation(req, res, next) 
}));

const app = express();
app.use(express.json());
import clienteRoutes from '../../routes/clienteRoutes';
app.use('/clientes', clienteRoutes);
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: 'error', message: err.message, errors: err.errors || undefined });
  }
  console.error('Erro INESPERADO no teste (controller handler):', err);
  return res.status(500).json({ status: 'error', message: 'Erro interno do servidor de teste (controller).' });
});

const mockClienteService = ActualClienteService as jest.Mocked<typeof ActualClienteService>;

const createMockControllerClienteData = (id: number, overrides: Partial<Cliente> = {}): Cliente => {
    const baseCliente: Cliente = {
        id, nome: `Ctrl Cliente Mock ${id}`, cnpjCpf: null,
        tipo: id % 2 === 0 ? $Enums.TipoCliente.PJ : $Enums.TipoCliente.PF,
        email: null, telefone: null, endereco: null, ativo: true,
        createdAt: new Date('2024-02-01T12:00:00Z'), updatedAt: new Date('2024-02-01T13:00:00Z'),
    };
    const finalOverrides: Partial<Cliente> = {};
    for (const key in overrides) {
        if (Object.prototype.hasOwnProperty.call(overrides, key)) {
            const k = key as keyof Cliente;
            const value = overrides[k];
            if (value === undefined && (k === 'email' || k === 'cnpjCpf' || k === 'telefone' || k === 'endereco')) {
                (finalOverrides as any)[k] = null;
            } else if (value !== undefined) {
                (finalOverrides as any)[k] = value;
            }
        }
    }
    return { ...baseCliente, ...finalOverrides };
};

const mockAuthenticatedUserCtrl = { userId: 1, email: 'test.ctrl@test.com', papel: $Enums.PapelUsuario.USUARIO };

describe('Cliente Controller - Rotas Protegidas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthMiddlewareImplementation = (req, res, next) => {
      (req as any).user = mockAuthenticatedUserCtrl;
      next();
    };
  });

  describe('POST /clientes', () => {
    // Este DTO deve ser válido conforme suas regras em clienteValidator.ts
    const clienteDtoValidoParaCtrl: CreateClienteDTO = {
      nome: 'Cliente Valido Para Post Controller',
      tipo: $Enums.TipoCliente.PJ,
      cnpjCpf: '03.319.508/0001-45', // CNPJ válido
      email: 'post.ctrl.valido.controller@exemplo.com', // Garante que email é string
    };

    it('deve criar um cliente e retornar 201 se o token for válido', async () => {
      // mockAuthMiddleware já configurado no beforeEach para sucesso
      
      // Criação do override para o mock de Cliente
      const overridesParaMock: Partial<Cliente> = {
        nome: clienteDtoValidoParaCtrl.nome,
        tipo: clienteDtoValidoParaCtrl.tipo,
        // Se cnpjCpf é opcional no DTO, trate undefined. Se obrigatório, o '?' não é necessário.
        cnpjCpf: clienteDtoValidoParaCtrl.cnpjCpf ? clienteDtoValidoParaCtrl.cnpjCpf.replace(/\D/g, '') : null,
        // Se email é opcional no DTO, trate undefined.
        email: clienteDtoValidoParaCtrl.email !== undefined ? clienteDtoValidoParaCtrl.email : null,
      };
      const mockCreatedCliente = createMockControllerClienteData(5, overridesParaMock);
      
      mockClienteService.createCliente.mockResolvedValue(mockCreatedCliente);

      const response = await request(app)
        .post('/clientes')
        .send(clienteDtoValidoParaCtrl)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.nome).toBe(clienteDtoValidoParaCtrl.nome);
      expect(mockClienteService.createCliente).toHaveBeenCalledWith(
        // O controller passa o DTO que foi validado pelo express-validator.
        // Se as validações sanitizam ou alteram campos, o DTO aqui seria o resultado disso.
        // Assumindo que CreateClienteDTO reflete os campos enviados após validação básica.
        expect.objectContaining(clienteDtoValidoParaCtrl)
      );
    });
  });

  // Mantenha os outros testes (GET, PUT, DELETE) como estavam na sua última versão
  // que passou, apenas garantindo que:
  // 1. Usem `mockClienteService.NOME_DO_METODO` (ex: `mockClienteService.getAllClientes`).
  // 2. Usem `$Enums.TipoCliente` para o campo `tipo`.
  // 3. A lógica para `createMockControllerClienteData` com `overrides` esteja correta
  //    para tratar `undefined` vs `null`.
  // 4. A definição de `updateDtoCtrl` esteja alinhada com `UpdateClienteDTO`
  //    (onde `tipo` agora é opcional).
});