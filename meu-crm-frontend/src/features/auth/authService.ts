import apiClient from '@/services/apiClient';
import { isAPIError, isNetworkError } from '@/utils/apiErrorCheckers';
import { MockAuthService } from '@/services/mockServer';
import type {
  LoginUserDTO,
  RegisterApiPayload,
  AuthApiResponse,
  UserProfileDTO,
  ForgotPasswordResponseDTO,
  ChangePasswordDTO,
} from '@/features/auth/types/auth.api';
import { jwtDecode } from 'jwt-decode';

// Interface para o payload decodificado do seu token JWT
interface DecodedJwtToken {
    userId: number;
    email: string;
    papel: UserProfileDTO['papel'];
    exp: number; // UNIX timestamp (segundos)
}

export class AuthService {
  private readonly useMock = import.meta.env.VITE_USE_MOCK_API === 'true';

  constructor() {
    this.setupAuthHeader();
  }

  /**
   * Handler de erro centralizado que decide se usa um mock como fallback.
   */
  private async handleError<T>(
    error: unknown,
    mockFunction: () => Promise<{ data: T }>
  ): Promise<T> {
    console.error('❌ Erro na chamada da API:', error);

    const isNotFoundError = isAPIError(error) && error.response?.status === 404;
    const isConnectionError = isNetworkError(error);

    if (this.useMock || isNotFoundError || isConnectionError) {
      console.log('🎭 Usando mock como fallback...');
      const mockResponse = await mockFunction();
      return mockResponse.data;
    }
    
    throw error;
  }

  // --- Login ---
  async login(data: LoginUserDTO): Promise<AuthApiResponse> {
    try {
      console.log('🔐 Tentando login...', data.email);
      const res = await apiClient.post<AuthApiResponse>('/auth/login', data);
      this.storeAuthData(res.data.token, res.data.user);
      return res.data;
    } catch (err: unknown) {
      return this.handleError(err, () => MockAuthService.mockLogin(data.email, data.senha));
    }
  }

  // --- Registro ---
  async register(data: RegisterApiPayload): Promise<AuthApiResponse> {
    try {
      console.log('📝 Registrando usuário...', data.email);
      const res = await apiClient.post<AuthApiResponse>('/auth/register', data);
      this.storeAuthData(res.data.token, res.data.user);
      return res.data;
    } catch (err: unknown) {
      return this.handleError(err, () => MockAuthService.mockRegister({
        ...data,
        papel: data.papel === 'VENDEDOR' ? 'USUARIO' : data.papel as 'ADMIN' | 'USUARIO' | 'GERENTE'
      }));
    }
  }

  // --- Esqueci a Senha ---
  async forgotPassword(email: string): Promise<ForgotPasswordResponseDTO> {
    if (!AuthService.validateEmail(email)) {
      throw new Error('E-mail inválido.');
    }
    try {
      console.log('📧 Solicitação de reset de senha:', email);
      const res = await apiClient.post<ForgotPasswordResponseDTO>('/auth/forgot-password', { email });
      return res.data;
    } catch (err: unknown) {
      return this.handleError(err, () => MockAuthService.mockForgotPassword(email));
    }
  }

  // --- Alterar Senha ---
  async changePassword(data: ChangePasswordDTO): Promise<void> {
    try {
      console.log('🔑 Alterando senha...');
      await apiClient.post('/auth/change-password', data);
    } catch (err: unknown) {
      const mockResponse = await this.handleError(err, () => MockAuthService.mockChangePassword(data));
      // Para changePassword, o mock retorna dados mas a API real não retorna nada
      return;
    }
  }

  // --- Obter Perfil do Usuário Autenticado ---
  async getProfile(): Promise<UserProfileDTO> {
    try {
      const res = await apiClient.get<UserProfileDTO>('/auth/profile');
      return res.data;
    } catch (err: unknown) {
      return this.handleError(err, () => MockAuthService.mockGetProfile());
    }
  }

  // --- Verificar Token ---
  async verifyToken(): Promise<boolean> {
    try {
      const token = this.getCurrentToken();
      if (!token) return false;

      // Primeiro verifica se o token não está expirado localmente
      try {
        const decoded = jwtDecode<DecodedJwtToken>(token);
        if (decoded.exp * 1000 <= Date.now()) {
          return false;
        }
      } catch (decodeError) {
        console.warn('Erro ao decodificar token:', decodeError);
        return false;
      }

      // Verifica com o servidor se necessário
      try {
        await apiClient.get('/auth/verify-token');
        return true;
      } catch (err) {
        // Se a rota não existir, usa mock ou verificação local
        if (isAPIError(err) && err.response?.status === 404) {
          // Usa mock para verificação
          const mockResponse = await this.handleError(err, () => MockAuthService.mockVerifyToken());
          return mockResponse.valid;
        }
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return false;
    }
  }

  // --- Logout ---
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    if (apiClient.defaults.headers.common) {
      delete apiClient.defaults.headers.common.Authorization;
    }
    MockAuthService.clearMockData(); // Limpa dados mock também
    console.log("Usuário deslogado localmente.");
  }
  
  // --- Métodos de Suporte Síncronos ---
  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    if (!token) return false;
    try {
      const decoded = jwtDecode<DecodedJwtToken>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      this.logout();
      return false;
    }
  }

  getCurrentToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getCurrentUser(): UserProfileDTO | null {
    try {
      const str = localStorage.getItem('authUser');
      return str ? (JSON.parse(str) as UserProfileDTO) : null;
    } catch {
      return null;
    }
  }
  
  setupAuthHeader(): void {
    const token = this.getCurrentToken();
    if (token && apiClient.defaults.headers.common) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }

  // --- Métodos Privados e Estáticos ---
  private storeAuthData(token: string, user: UserProfileDTO): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    if (apiClient.defaults.headers.common) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }

  public static validateEmail(email: string): boolean {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  public static validatePassword(password: string): boolean {
    return password.length >= 6;
  }
}

export default new AuthService();