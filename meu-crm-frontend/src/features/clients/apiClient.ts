// src/services/apiClient.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Criar instância do axios
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000'
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Se receber 401 (Unauthorized), limpar token e redirecionar para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      
      // Só redirecionar se não estiver já na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Tratar outros erros comuns
    if (error.response?.status === 403) {
      console.error('Acesso negado:', error.response.data);
    }

    if (error.response?.status === 404) {
      console.error('Recurso não encontrado:', error.response.data);
    }

    if (error.response?.status >= 500) {
      console.error('Erro interno do servidor:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// src/utils/errorHandler.ts - Utilitário para tratar erros
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  status?: number;
}

export const handleApiError = (error: any): ApiError => {
  // Erro de rede
  if (!error.response) {
    return {
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      code: 'NETWORK_ERROR',
    };
  }

  const { status, data } = error.response;

  // Erro de validação (400)
  if (status === 400) {
    if (data.errors && Array.isArray(data.errors)) {
      // Erros de validação do express-validator
      const firstError = data.errors[0];
      return {
        message: firstError.msg || 'Dados inválidos',
        field: firstError.param,
        status,
      };
    }
    
    if (data.message) {
      return {
        message: data.message,
        status,
      };
    }
  }

  // Erro de autenticação (401)
  if (status === 401) {
    return {
      message: 'Credenciais inválidas ou sessão expirada',
      code