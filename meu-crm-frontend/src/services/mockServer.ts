import type { UserProfileDTO, AuthApiResponse, ForgotPasswordResponseDTO } from '@/features/auth/types/auth.api';

export interface MockResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

// Classe estática para simular serviços de autenticação
export class MockAuthService {
  private static delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async mockLogin(email: string, senha: string): Promise<MockResponse<AuthApiResponse>> {
    await this.delay();

    // Credenciais válidas para teste
    const validCredentials = [
      { 
        id: 1,
        email: 'admin@transpontual.com.br', 
        senha: '123456', 
        papel: 'ADMIN' as const, 
        nome: 'Administrador Sistema' 
      },
      { 
        id: 2,
        email: 'gerente@transpontual.com.br', 
        senha: '123456', 
        papel: 'GERENTE' as const, 
        nome: 'Gerente Operacional' 
      },
      { 
        id: 3,
        email: 'usuario@transpontual.com.br', 
        senha: '123456', 
        papel: 'USUARIO' as const, 
        nome: 'Usuário Padrão' 
      },
      { 
        id: 4,
        email: 'barbosageovanni@transpontual.com.br', 
        senha: '123456', 
        papel: 'ADMIN' as const, 
        nome: 'Giovanni Barbosa' 
      }
    ];

    const user = validCredentials.find(cred => 
      cred.email === email && cred.senha === senha
    );

    if (!user) {
      throw new Error('E-mail ou senha incorretos');
    }

    const mockUser: UserProfileDTO = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      papel: user.papel,
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const authResponse: AuthApiResponse = {
      token: `mock-jwt-token-${user.id}-${Date.now()}`,
      user: mockUser
    };

    return {
      data: authResponse,
      status: 200,
      message: 'Login realizado com sucesso'
    };
  }

  static async mockRegister(userData: {
    nome: string;
    email: string;
    senha: string;
    papel: 'ADMIN' | 'GERENTE' | 'USUARIO';
  }): Promise<MockResponse<AuthApiResponse>> {
    await this.delay();

    // Simula verificação de email já existente
    const existingEmails = [
      'admin@transpontual.com.br',
      'gerente@transpontual.com.br',
      'usuario@transpontual.com.br'
    ];

    if (existingEmails.includes(userData.email)) {
      throw new Error('E-mail já está em uso');
    }

    const newUserId = Math.floor(Math.random() * 1000) + 100;
    
    const mockUser: UserProfileDTO = {
      id: newUserId,
      nome: userData.nome,
      email: userData.email,
      papel: userData.papel,
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const authResponse: AuthApiResponse = {
      token: `mock-jwt-token-${newUserId}-${Date.now()}`,
      user: mockUser
    };

    return {
      data: authResponse,
      status: 201,
      message: 'Usuário registrado com sucesso'
    };
  }

  static async mockGetProfile(): Promise<MockResponse<UserProfileDTO>> {
    await this.delay(500);

    // Simula obtenção do perfil baseado no token armazenado
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (!token || !token.startsWith('mock-jwt-token')) {
      throw new Error('Token inválido ou expirado');
    }

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as UserProfileDTO;
        return {
          data: user,
          status: 200,
          message: 'Perfil obtido com sucesso'
        };
      } catch (error) {
        console.error('Erro ao fazer parse do usuário armazenado:', error);
      }
    }

    // Fallback para usuário padrão se não houver dados armazenados
    const defaultUser: UserProfileDTO = {
      id: 1,
      nome: 'Usuário Mock',
      email: 'usuario@mock.com',
      papel: 'USUARIO',
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      data: defaultUser,
      status: 200,
      message: 'Perfil padrão retornado'
    };
  }

  static async mockForgotPassword(email: string): Promise<MockResponse<ForgotPasswordResponseDTO>> {
    await this.delay();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('E-mail inválido');
    }

    const forgotPasswordResponse: ForgotPasswordResponseDTO = {
      success: true,
      message: 'Se o e-mail estiver registrado, instruções de redefinição de senha serão enviadas.'
    };

    return {
      data: forgotPasswordResponse,
      status: 200,
      message: 'E-mail de recuperação enviado'
    };
  }

  static async mockChangePassword(data: {
    senhaAtual: string;
    novaSenha: string;
    confirmarNovaSenha?: string;
  }): Promise<MockResponse<{ success: boolean; message: string }>> {
    await this.delay();

    // Validações básicas
    if (!data.senhaAtual || !data.novaSenha) {
      throw new Error('Senha atual e nova senha são obrigatórias');
    }

    if (data.novaSenha.length < 6) {
      throw new Error('Nova senha deve ter pelo menos 6 caracteres');
    }

    if (data.confirmarNovaSenha && data.novaSenha !== data.confirmarNovaSenha) {
      throw new Error('Confirmação de senha não confere');
    }

    // Simula verificação da senha atual (sempre aceita "123456" como senha atual válida)
    if (data.senhaAtual !== '123456') {
      throw new Error('Senha atual incorreta');
    }

    return {
      data: {
        success: true,
        message: 'Senha alterada com sucesso'
      },
      status: 200,
      message: 'Senha alterada com sucesso'
    };
  }

  static async mockVerifyToken(): Promise<MockResponse<{ valid: boolean }>> {
    await this.delay(300);

    const token = localStorage.getItem('authToken');
    
    if (!token || !token.startsWith('mock-jwt-token')) {
      return {
        data: { valid: false },
        status: 401,
        message: 'Token inválido'
      };
    }

    // Simula verificação de expiração do token
    // Para fins de teste, considera tokens válidos por 24 horas
    const tokenParts = token.split('-');
    if (tokenParts.length >= 4) {
      const timestamp = parseInt(tokenParts[tokenParts.length - 1]);
      const now = Date.now();
      const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return {
          data: { valid: false },
          status: 401,
          message: 'Token expirado'
        };
      }
    }

    return {
      data: { valid: true },
      status: 200,
      message: 'Token válido'
    };
  }

  static async mockRefreshToken(): Promise<MockResponse<{ token: string }>> {
    await this.delay(500);

    const currentToken = localStorage.getItem('authToken');
    
    if (!currentToken || !currentToken.startsWith('mock-jwt-token')) {
      throw new Error('Token inválido para renovação');
    }

    // Extrai o ID do usuário do token atual
    const tokenParts = currentToken.split('-');
    const userId = tokenParts.length >= 4 ? tokenParts[3] : '1';
    
    const newToken = `mock-jwt-token-${userId}-${Date.now()}`;

    return {
      data: { token: newToken },
      status: 200,
      message: 'Token renovado com sucesso'
    };
  }

  // Método utilitário para limpar dados mock
  static clearMockData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }

  // Método para simular diferentes cenários de erro
  static async mockWithError(errorType: 'network' | 'server' | 'validation'): Promise<never> {
    await this.delay(500);
    
    switch (errorType) {
      case 'network':
        throw new Error('Erro de conectividade. Verifique sua conexão com a internet.');
      case 'server':
        throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
      case 'validation':
        throw new Error('Dados inválidos fornecidos.');
      default:
        throw new Error('Erro desconhecido');
    }
  }
}

// Classe para simular outros serviços mock se necessário
export class MockClienteService {
  private static delay(ms: number = 800): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async mockGetClientes(): Promise<MockResponse<any[]>> {
    await this.delay();
    
    return {
      data: [
        {
          id: 1,
          nome: 'Empresa ABC Ltda',
          tipo: 'PJ',
          cnpjCpf: '12345678000199',
          email: 'contato@empresaabc.com.br',
          telefone: '11999999999',
          endereco: 'Rua das Flores, 123',
          ativo: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-06-11T16:15:09Z'
        },
        {
          id: 2,
          nome: 'João Silva Santos',
          tipo: 'PF',
          cnpjCpf: '12345678901',
          email: 'joao.silva@email.com',
          telefone: '11888888888',
          endereco: 'Av. Principal, 456',
          ativo: true,
          createdAt: '2024-02-20T14:30:00Z',
          updatedAt: '2024-06-11T16:15:09Z'
        }
      ],
      status: 200,
      message: 'Clientes obtidos com sucesso'
    };
  }
}

export default MockAuthService;