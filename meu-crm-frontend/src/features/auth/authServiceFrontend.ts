// src/features/auth/authServiceFrontend.ts
import axios, { AxiosResponse } from 'axios';
import type {
  LoginUserDTO,
  RegisterUserDTO,
  AuthApiResponse,
  UserProfileDTO,
  ForgotPasswordDTO,
  ChangePasswordDTO,
} from './types/auth.api';

// Configuração base da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Instance do axios configurada
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar respostas e erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class AuthServiceFrontend {
  // Método de login
  async login(credentials: LoginUserDTO): Promise<AuthApiResponse> {
    try {
      const response: AxiosResponse<AuthApiResponse> = await apiClient.post('/auth/login', credentials);
      
      // Armazena token e dados do usuário
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Método de registro
  async register(userData: RegisterUserDTO): Promise<AuthApiResponse> {
    try {
      // Remove confirmaSenha antes de enviar para a API
      const { confirmaSenha, ...apiData } = userData;
      
      // Garante que papel não seja undefined
      const registerData = {
        ...apiData,
        papel: apiData.papel || 'USUARIO' as const
      };
      
      const response: AxiosResponse<AuthApiResponse> = await apiClient.post('/auth/register', registerData);
      
      // Armazena token e dados do usuário
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  // Método de logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Método para esqueceu senha
  async forgotPassword(email: string): Promise<void> {
    try {
      const forgotPasswordData: ForgotPasswordDTO = { email };
      await apiClient.post('/auth/forgot-password', forgotPasswordData);
    } catch (error: any) {
      console.error('Erro ao solicitar reset de senha:', error);
      throw error;
    }
  }

  // Método para alterar senha
  async changePassword(passwords: ChangePasswordDTO): Promise<void> {
    try {
      const { confirmaNovaSenha, ...apiData } = passwords;
      await apiClient.post('/auth/change-password', {
        senhaAtual: apiData.senhaAtual,
        novaSenha: apiData.novaSenha,
      });
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  }

  // Método para verificar token
  async verifyToken(): Promise<boolean> {
    try {
      const token = this.getCurrentToken();
      if (!token) return false;

      await apiClient.get('/auth/verify-token');
      return true;
    } catch (error) {
      console.error('Token inválido:', error);
      this.logout();
      return false;
    }
  }

  // Método para obter perfil do usuário
  async getUserProfile(): Promise<UserProfileDTO> {
    try {
      const response: AxiosResponse<UserProfileDTO> = await apiClient.get('/auth/profile');
      
      // Atualiza dados do usuário no localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao obter perfil:', error);
      throw error;
    }
  }

  // Método para obter token atual
  getCurrentToken(): string | null {
    return localStorage.getItem('token');
  }

  // Método para obter usuário atual
  getCurrentUser(): UserProfileDTO | null {
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Erro ao parse do usuário do localStorage:', error);
      return null;
    }
  }

  // Método para verificar se está autenticado
  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }
}

// Instância singleton do serviço
const authServiceFrontend = new AuthServiceFrontend();

// Funções de validação frontend
export const validateEmailFrontend = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePasswordFrontend = (password: string): boolean => {
  return password.length >= 6;
};

export const validateNameFrontend = (name: string): boolean => {
  return name.trim().length >= 3;
};

export const validatePasswordConfirmation = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// Funções auxiliares exportadas para usar nos componentes
export const loginUser = (credentials: LoginUserDTO) => authServiceFrontend.login(credentials);
export const registerUser = (userData: RegisterUserDTO) => authServiceFrontend.register(userData);
export const logoutUser = () => authServiceFrontend.logout();
export const forgotPasswordUser = (email: string) => authServiceFrontend.forgotPassword(email);
export const changePasswordUser = (passwords: ChangePasswordDTO) => authServiceFrontend.changePassword(passwords);
export const verifyUserToken = () => authServiceFrontend.verifyToken();
export const getUserProfile = () => authServiceFrontend.getUserProfile();
export const getCurrentUser = () => authServiceFrontend.getCurrentUser();
export const getCurrentToken = () => authServiceFrontend.getCurrentToken();
export const isUserAuthenticated = () => authServiceFrontend.isAuthenticated();

// Exporta a instância do serviço
export default authServiceFrontend;