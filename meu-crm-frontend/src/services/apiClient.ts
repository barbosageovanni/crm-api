// src/services/apiClient.ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Cria uma instância do Axios com configurações base
const apiClient: AxiosInstance = axios.create({
  // Lê a URL base do .env (via Vite)
  // Certifique-se de que o arquivo .env na raiz do projeto frontend existe
  // e contém a linha: VITE_API_URL=http://localhost:4000 (ou a URL do seu backend)
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição para adicionar o token JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken'); // Pega o token do localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Faça algo com o erro da requisição
    return Promise.reject(error);
  }
);

// Interceptor de Resposta (Opcional, para tratamento de erros global, como 401)
apiClient.interceptors.response.use(
  (response) => {
    // Qualquer código de status que esteja dentro do range de 2xx causa o acionamento desta função
    return response;
  },
  (error) => {
    // Qualquer código de status que caia fora do range de 2xx causa o acionamento desta função
    if (error.response && error.response.status === 401) {
      // Exemplo: Se for 401 (Não autorizado), deslogar o usuário
      console.error('Erro 401: Não autorizado. Limpando token e redirecionando para login...');
      localStorage.removeItem('authToken');
      // Força o reload para que o AuthContext detecte a ausência do token
      // Idealmente, chame uma função de logout do seu AuthContext aqui
      window.location.href = '/login'; // Redireciona para a página de login
    }
    // É importante rejeitar a promise para que o erro possa ser tratado no local da chamada (catch)
    return Promise.reject(error);
  }
);

export default apiClient;


