// 1. IMPORTAÇÕES DE TIPOS PRIMEIRO
// Estes são apenas tipos e não executam código que depende de mocks ainda.
import { Usuario as PrismaUsuarioType, PapelUsuario, Prisma } from '@prisma/client';
import { RegisterUserDTO, LoginUserDTO, UserPublicProfileDTO, AuthResponseDTO } from '../../dtos/authDtos';
import { AppError, DuplicateError, ValidationError } from '../../errors/AppError';

// 2. MOCK DAS VARIÁVEIS DE AMBIENTE
// Faça isso antes de importar o serviço que pode lê-las no nível do módulo.
process.env.JWT_SECRET = 'seu_segredo_de_teste_super_secreto_e_longo_novamente';
process.env.JWT_EXPIRES_IN = '3600'; // 1 hora em segundos

// 3. MOCKS PARA DEPENDÊNCIAS QUE NÃO SÃO O PRISMA CLIENT
// Estes são "içados" (hoisted) pelo Jest.
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
}));

// Importe bcryptjs e jsonwebtoken DEPOIS de seus respectivos jest.mock se você
// for fazer type casting como (bcryptjs.compare as jest.Mock).
// Se não, apenas o jest.mock('module-name', ...) é suficiente.
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('mockedSaltValueFromTop')),
  hash: jest.fn((data: string, salt: string) => Promise.resolve(`hashed_${data}_with_${salt}`)),
  compare: jest.fn(() => Promise.resolve(true)), // Padrão para sucesso
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked.jwt.token.from.top.mock'),
  verify: jest.fn(),
}));


// 4. MOCK PARA O PRISMA CLIENT - ESTRUTURA CORRIGIDA PARA O REFERENCEERROR
// ETAPA 4.1: CRIE AS FUNÇÕES MOCK INDIVIDUAIS QUE O DELEGATE 'usuario' USARÁ.
// Estas são as referências que seus testes usarão para .mockResolvedValue etc.
const mockPrismaUsuarioFindUnique_AuthTest = jest.fn();
const mockPrismaUsuarioCreate_AuthTest = jest.fn();
// Adicione outras funções mockadas para o delegate 'usuario' se o AuthService as usar no futuro.

// ETAPA 4.2: AGORA CONFIGURE O jest.mock PARA O MÓDULO DO PRISMA CLIENT.
// A função de fábrica usará as funções mockadas definidas acima.
jest.mock('../../prisma/client', () => ({
  __esModule: true, // Necessário para módulos ES6 com export default
  default: { // 'prisma' é o export default de ../../prisma/client.ts
    usuario: { // O delegate 'usuario' agora usa os mocks definidos acima
      findUnique: mockPrismaUsuarioFindUnique_AuthTest,
      create: mockPrismaUsuarioCreate_AuthTest,
      // Mapeie outras operações do 'usuario' aqui se o AuthService as usar
    },
    // Mock outros delegados (ex: produto) ou métodos de nível superior do Prisma
    // (ex: $transaction) se AuthService os usar.
  },
  // Se AuthService importar 'Prisma' (namespace para tipos de erro)
  // diretamente de '../../prisma/client' (o que é incomum, geralmente é de '@prisma/client'),
  // você precisaria mockar 'Prisma' aqui também.
  // No nosso AuthService, 'Prisma' é importado de '@prisma/client', então não é necessário aqui.
}));


// 5. IMPORTE O SERVIÇO A SER TESTADO *DEPOIS* DE TODOS OS MOCKS ESTAREM CONFIGURADOS
import { authService } from '../authService';


// --- SEUS BLOCOS DE TESTE COMEÇAM AQUI ---
describe('AuthService', () => {
  // Helper para criar um mock de Usuario consistente
  const createMockPrismaUser = (id: number, data: Partial<PrismaUsuarioType> = {}): PrismaUsuarioType => ({
    id,
    nome: `Usuário Teste ${id}`,
    email: `teste${id}@exemplo.com`,
    senhaHash: 'senhaHasheadaPadraoParaTesteValida123',
    papel: PapelUsuario.USUARIO,
    ativo: true,
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T11:00:00.000Z'),
    ...data,
  });

  beforeEach(() => {
    // Limpa o histórico de chamadas e implementações de TODOS os mocks do Jest.
    jest.clearAllMocks();

    // Opcionalmente, resete os mocks específicos para um estado padrão se necessário,
    // especialmente se você mudar suas implementações em testes individuais.
    mockPrismaUsuarioFindUnique_AuthTest.mockReset();
    mockPrismaUsuarioCreate_AuthTest.mockReset();
    
    // Redefine comportamentos padrão para bcryptjs e jwt para cada teste
    (bcryptjs.genSalt as jest.Mock).mockResolvedValue('mockedSaltValueFromTop');
    (bcryptjs.hash as jest.Mock).mockImplementation((data: string, salt: string) =>
      Promise.resolve(`hashed_${data}_with_${salt}`)
    );
    (bcryptjs.compare as jest.Mock).mockResolvedValue(true); // Padrão para sucesso no login
    (jwt.sign as jest.Mock).mockReturnValue('mocked.jwt.token.from.top.mock'); // Token padrão
  });

  // --- Testes para o método register ---
  describe('register', () => {
    const registerDto: RegisterUserDTO = {
      nome: 'Usuário de Registro Teste',
      email: 'registrar.service.teste@exemplo.com',
      senha: 'senhaDeRegistroValida123',
      papel: PapelUsuario.USUARIO,
    };

    it('deve registrar um novo usuário com sucesso e retornar o perfil público', async () => {
      const hashedPassword = `hashed_${registerDto.senha}_with_mockedSaltValueFromTop`;
      const expectedCreatedUser = createMockPrismaUser(1, {
        ...registerDto,
        senhaHash: hashedPassword,
        ativo: true,
      });

      // Use as referências corretas para os mocks do Prisma
      mockPrismaUsuarioFindUnique_AuthTest.mockResolvedValue(null);
      mockPrismaUsuarioCreate_AuthTest.mockResolvedValue(expectedCreatedUser);

      const result = await authService.register(registerDto);

      expect(mockPrismaUsuarioFindUnique_AuthTest).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(bcryptjs.genSalt).toHaveBeenCalledWith(10);
      expect(bcryptjs.hash).toHaveBeenCalledWith(registerDto.senha, 'mockedSaltValueFromTop');
      expect(mockPrismaUsuarioCreate_AuthTest).toHaveBeenCalledWith({
        data: {
          nome: registerDto.nome,
          email: registerDto.email,
          senhaHash: hashedPassword,
          papel: registerDto.papel,
          ativo: true,
        },
      });
      // Verifica se o resultado corresponde à estrutura de UserPublicProfileDTO
      expect(result).toEqual({
        id: expectedCreatedUser.id,
        nome: expectedCreatedUser.nome,
        email: expectedCreatedUser.email,
        papel: expectedCreatedUser.papel,
        ativo: expectedCreatedUser.ativo,
      });
    });

    it('deve lançar DuplicateError se o email já existir', async () => {
      const existingUser = createMockPrismaUser(2, { email: registerDto.email });
      mockPrismaUsuarioFindUnique_AuthTest.mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow(DuplicateError);
      await expect(authService.register(registerDto)).rejects.toMatchObject({
        message: new DuplicateError('Email', registerDto.email).message,
      });
      expect(mockPrismaUsuarioCreate_AuthTest).not.toHaveBeenCalled();
    });
    
    it('deve lançar ValidationError se campos obrigatórios estiverem faltando', async () => {
      const incompleteDto = { email: 'teste@ex.com' } as RegisterUserDTO;
      const expectedMessage = 'Todos os campos (nome, email, senha, papel) são obrigatórios para registro.';
      await expect(authService.register(incompleteDto)).rejects.toThrow(new ValidationError([], expectedMessage));
    });

    it('deve lançar AppError (erro interno) se prisma.create falhar com erro genérico', async () => {
        mockPrismaUsuarioFindUnique_AuthTest.mockResolvedValue(null);
        const dbError = new Error('DB create generic failure from this test');
        mockPrismaUsuarioCreate_AuthTest.mockRejectedValue(dbError);

        await expect(authService.register(registerDto)).rejects.toThrow(
            new AppError(`Erro interno ao registrar usuário: ${dbError.message}`, 500)
        );
    });

    it('deve lançar DuplicateError se prisma.create falhar com Prisma P2002 (unique constraint)', async () => {
        mockPrismaUsuarioFindUnique_AuthTest.mockResolvedValue(null);
        const prismaP2002Error = new Prisma.PrismaClientKnownRequestError(
            'Unique constraint failed on the fields: (`email`)', 
            { code: 'P2002', clientVersion: 'mock.prisma.version.test', meta: { target: ['email'] } }
        );
        mockPrismaUsuarioCreate_AuthTest.mockRejectedValue(prismaP2002Error);

        await expect(authService.register(registerDto)).rejects.toThrow(
            new DuplicateError('Email', registerDto.email)
        );
    });
  });

  // --- Testes para o método login ---
  describe('login', () => {
    const loginDto: LoginUserDTO = {
      email: 'login.valido.teste@exemplo.com',
      senha: 'senhaCorretaLogin123',
    };
    const mockUserForLogin = createMockPrismaUser(10, {
      email: loginDto.email,
      senhaHash: `hashed_${loginDto.senha}_with_mockedSaltValueFromTop`,
      ativo: true,
      papel: PapelUsuario.GERENTE,
    });

    it('deve fazer login com sucesso e retornar UserPublicProfileDTO e token', async () => {
      mockPrismaUsuarioFindUnique_AuthTest.mockResolvedValue(mockUserForLogin);
      // bcryptjs.compare mockado no beforeEach para retornar true por padrão

      const result = await authService.login(loginDto);

      expect(mockPrismaUsuarioFindUnique_AuthTest).toHaveBeenCalledWith({ where: { email: loginDto.email } });
      expect(bcryptjs.compare).toHaveBeenCalledWith(loginDto.senha, mockUserForLogin.senhaHash);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserForLogin.id, email: mockUserForLogin.email, papel: mockUserForLogin.papel },
        process.env.JWT_SECRET,
        { expiresIn: Number(process.env.JWT_EXPIRES_IN) }
      );
      expect(result.user).toEqual({
        id: mockUserForLogin.id,
        nome: mockUserForLogin.nome,
        email: mockUserForLogin.email,
        papel: mockUserForLogin.papel,
        ativo: mockUserForLogin.ativo,
      });
      expect(result.token).toBe('mocked.jwt.token.from.top.mock');
    });

    it('deve lançar ValidationError se email ou senha estiverem faltando no DTO', async () => {
        const expectedMessage = 'Email e senha são obrigatórios.';
        await expect(authService.login({} as LoginUserDTO)).rejects.toThrow(new ValidationError([], expectedMessage));
    });
    
    it('deve lançar AppError 401 (Credenciais inválidas) para email não encontrado', async () => {
      mockPrismaUsuarioFindUnique_AuthTest.mockResolvedValue(null);
      await expect(authService.login(loginDto)).rejects.toThrow(new AppError('Credenciais inválidas.', 401));
    });

    it('deve lançar AppError 403 (Usuário inativo) para usuário inativo', async () => {
      const inactiveUser = createMockPrismaUser(11, { ...loginDto, ativo: false });
      mockPrismaUsuarioFindUnique_AuthTest.mockResolvedValue(inactiveUser);
      await expect(authService.login(loginDto)).rejects.toThrow(new AppError('Usuário inativo.', 403));
    });

    it('deve lançar AppError 401 (Credenciais inválidas) para senha incorreta', async () => {
      mockPrismaUsuarioFindUnique_AuthTest.mockResolvedValue(mockUserForLogin);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false); // Senha não corresponde
      await expect(authService.login(loginDto)).rejects.toThrow(new AppError('Credenciais inválidas.', 401));
    });
  });
});