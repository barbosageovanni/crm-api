import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Interface para padronizar respostas de erro da API
interface APIErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
  details?: any;
}

// Criar instância do axios
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 15000, // Aumentado para 15 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// CORREÇÃO: Interceptor de requisição melhorado
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log da requisição para debug (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Adicionar token se existir
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// CORREÇÃO: Interceptor de resposta totalmente reescrito
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log da resposta para debug (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError<APIErrorResponse>) => {
    const originalRequest = error.config;
    
    // Log do erro para debug
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.response?.status} ${originalRequest?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    // Tratamento específico por status code
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token inválido ou expirado
          console.warn('🔐 Token inválido - fazendo logout automático');
          
          // Limpar dados de autenticação
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          
          // Remover header de autorização
          delete apiClient.defaults.headers.common['Authorization'];
          
          // Redirecionar apenas se não estiver na página de login ou forgot-password
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/forgot-password') {
            window.location.href = '/login';
          }
          break;

        case 403:
          console.error('🚫 Acesso negado:', data?.message || 'Permissão insuficiente');
          break;

        case 404:
          console.error('🔍 Recurso não encontrado:', originalRequest?.url);
          
          // Se for uma rota de autenticação, criar erro mais específico
          if (originalRequest?.url?.includes('/auth/')) {
            const customError = new Error(
              `Rota não encontrada: ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`
            );
            (customError as any).response = error.response;
            (customError as any).status = 404;
            (customError as any).isAPIError = true;
            return Promise.reject(customError);
          }
          break;

        case 429:
          console.error('⚠️ Muitas requisições:', data?.message || 'Rate limit atingido');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          console.error('🔧 Erro do servidor:', data?.message || 'Erro interno do servidor');
          break;

        default:
          console.error(`❓ Erro desconhecido (${status}):`, data?.message || error.message);
      }

      // Criar erro padronizado
      const apiError = new Error(
        data?.message || error.message || `Erro HTTP ${status}`
      );
      (apiError as any).response = error.response;
      (apiError as any).status = status;
      (apiError as any).isAPIError = true;

      return Promise.reject(apiError);
    }

    // Erros de rede (sem resposta do servidor)
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('🌐 Erro de rede - servidor indisponível');
      
      const networkError = new Error(
        'Erro de conexão. Verifique sua internet e tente novamente.'
      );
      (networkError as any).isNetworkError = true;
      
      return Promise.reject(networkError);
    }

    // Timeout
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout da requisição');
      
      const timeoutError = new Error(
        'Requisição demorou muito para responder. Tente novamente.'
      );
      (timeoutError as any).isTimeoutError = true;
      
      return Promise.reject(timeoutError);
    }

    // Outros erros
    console.error('❌ Erro desconhecido:', error);
    return Promise.reject(error);
  }
);

// Função utilitária para verificar se é erro da API
export const isAPIError = (error: any): boolean => {
  return error?.isAPIError === true;
};

// Função utilitária para verificar se é erro de rede
export const isNetworkError = (error: any): boolean => {
  return error?.isNetworkError === true;
};

// Função utilitária para verificar se é erro de timeout
export const isTimeoutError = (error: any): boolean => {
  return error?.isTimeoutError === true;
};

export default apiClient;