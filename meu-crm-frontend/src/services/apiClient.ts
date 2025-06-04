// src/services/apiClient.ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

// Defina a URL base da sua API
// Para Vite, use import.meta.env.VITE_API_URL se precisar de variáveis de ambiente
const API_BASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 
  '/api'; // Fallback para /api
// Cria uma instância do Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: Adiciona o token de autenticação
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // Tratar erro na configuração da requisição
    console.error('Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Trata erros globais (ex: 401 Unauthorized)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Retorna a resposta se for bem-sucedida
    return response;
  },
  (error: AxiosError) => {
    // Tratar erros de resposta
    if (error.response) {
      console.error('Erro na resposta da API:', error.response.status, error.response.data);
      
      // Exemplo: Tratar erro 401 (Não Autorizado)
      if (error.response.status === 401) {
        // Limpar token e redirecionar para login
        localStorage.removeItem('authToken');
        // Idealmente, usar um método centralizado para logout ou notificar o estado da aplicação
        // Exemplo simples de redirecionamento:
        if (window.location.pathname !== '/login') {
           window.location.href = '/login';
        }
        console.warn('Sessão expirada ou inválida. Redirecionando para login.');
      }
      // Você pode adicionar tratamento para outros códigos de status aqui (403, 500, etc.)
      
    } else if (error.request) {
      // A requisição foi feita, mas não houve resposta (ex: problema de rede)
      console.error('Erro na requisição (sem resposta):', error.request);
    } else {
      // Algo aconteceu ao configurar a requisição que disparou um erro
      console.error('Erro ao configurar a requisição:', error.message);
    }
    
    // Rejeita a promessa para que o erro possa ser tratado localmente também
    return Promise.reject(error);
  }
);

export default apiClient;

