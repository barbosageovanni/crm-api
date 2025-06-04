// src/features/auth/authService.ts
import apiClient from '../../services/apiClient';
import {
  type LoginUserDTO,
  type RegisterUserDTO,
  type AuthResponseDTO,
  type UserProfileDTO,
  type UpdateProfileDTO,
  type ChangePasswordDTO
} from './authDtos';

class AuthService {

  // Login do usuário
  async login(loginData: LoginUserDTO): Promise<AuthResponseDTO> {
    try {
      const response = await apiClient.post<AuthResponseDTO>('/auth/login', loginData);
      // Armazena o token após o login bem-sucedido
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      return response.data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Registro de novo usuário
  async register(registerData: RegisterUserDTO): Promise<AuthResponseDTO> {
    try {
      // CORREÇÃO: Não tenta mais desestruturar 'confirmaSenha', pois não existe em RegisterUserDTO.
      // O objeto 'registerData' já deve vir formatado corretamente do frontend.
      const response = await apiClient.post<AuthResponseDTO>('/auth/register', registerData);
      // Armazena o token após o registro bem-sucedido (se a API retornar um)
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      return response.data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  // Obter perfil do usuário atual
  async getProfile(): Promise<UserProfileDTO> {
    try {
      const response = await apiClient.get<UserProfileDTO>('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      // Se o erro for 401 (Não autorizado), desloga o usuário
      if ((error as any).response?.status === 401) {
        this.logout();
      }
      throw error;
    }
  }

  // Atualizar perfil do usuário
  async updateProfile(updateData: UpdateProfileDTO): Promise<UserProfileDTO> {
    try {
      const response = await apiClient.put<UserProfileDTO>('/auth/profile', updateData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      if ((error as any).response?.status === 401) {
        this.logout();
      }
      throw error;
    }
  }

  // Alterar senha
  async changePassword(passwordData: ChangePasswordDTO): Promise<{ message: string }> {
    try {
      // Remove confirmaNovaSenha antes de enviar, se existir (validação apenas frontend)
      const { confirmaNovaSenha, ...dataToSend } = passwordData;
      const response = await apiClient.post<{ message: string }>('/auth/change-password', dataToSend);
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      if ((error as any).response?.status === 401) {
        this.logout();
      }
      throw error;
    }
  }

  // Logout (limpa token local e header da API)
  logout(): void {
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
    // Opcional: Redirecionar para a página de login ou notificar a aplicação
    // window.location.href = '/login';
  }

  // Verificar se o usuário está autenticado (checa apenas a existência do token)
  // Uma verificação mais robusta envolveria validar a expiração do token
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  // Obter token atual
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Configura o header de autorização para o apiClient (útil ao iniciar a app)
  setupAuthHeader(): void {
    const token = this.getToken();
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  // Métodos estáticos de validação (podem ser movidos para utils se preferir)
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 6;
  }
}

// Cria e exporta uma instância única do serviço
const authServiceInstance = new AuthService();
// Configura o header de autorização ao carregar o módulo (se houver token)
authServiceInstance.setupAuthHeader();

export default authServiceInstance;

