// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react'; // <-- Importação de tipo separada
import apiClient from '../services/apiClient';
import authService from '../features/auth/authService';
// <-- Garante que estas importações também sejam type-only
import type { LoginUserDTO, UserProfileDTO, PapelUsuario } from '../features/auth/authDtos';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfileDTO | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (loginData: LoginUserDTO) => Promise<void>;
  logout: () => void;
  updateUser: (user: UserProfileDTO) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('authToken'),
  });
  // Inicializa como true para mostrar loading até a verificação inicial terminar
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Efeito para verificar o token no localStorage ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          console.log("AuthContext: Token encontrado, tentando validar...");
          // Configura o token no apiClient
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Tenta obter o perfil do usuário para validar o token
          const user = await authService.getProfile();
          console.log("AuthContext: Perfil obtido com sucesso:", user);
          
          setAuthState({
            isAuthenticated: true,
            user,
            token,
          });
        } catch (error: any) {
          console.error('AuthContext: Erro ao validar token ou obter perfil:', error.response?.data || error.message || error);
          // Remove token inválido
          localStorage.removeItem('authToken');
          delete apiClient.defaults.headers.common['Authorization'];
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
          });
        } finally {
          // Garante que o loading termine mesmo se houver erro
          console.log("AuthContext: Finalizando inicialização, setLoading(false)");
          setIsLoading(false);
        }
      } else {
        // Se não há token, finaliza o loading
        console.log("AuthContext: Nenhum token encontrado, setLoading(false)");
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Executa apenas uma vez na montagem

  const login = async (loginData: LoginUserDTO) => {
    // Não precisa setar isLoading aqui, pois a página de login já pode ter seu próprio loading
    // setIsLoading(true); 
    try {
      const response = await authService.login(loginData);
      const { user, token } = response;

      // Salva o token e configura o apiClient
      localStorage.setItem('authToken', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setAuthState({
        isAuthenticated: true,
        user,
        token,
      });
      // O redirecionamento ocorrerá no componente LoginPage ou pelo PublicRoute
    } catch (error) {
      // Limpa dados em caso de erro
      localStorage.removeItem('authToken');
      delete apiClient.defaults.headers.common['Authorization'];
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error; // Re-lança o erro para ser tratado no componente LoginPage
    } finally {
      // Não precisa setar isLoading aqui
      // setIsLoading(false);
    }
  };

  const logout = () => {
    // Remove token e limpa estado
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
    // O redirecionamento ocorrerá pelo ProtectedRoute
  };

  const updateUser = (user: UserProfileDTO) => {
    setAuthState(prevState => ({
      ...prevState,
      user,
    }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
    isLoading, // O isLoading do contexto reflete a validação inicial do token
  };

  // O App.tsx usa o isLoading do contexto para exibir o spinner inicial
  // Se isLoading for false e isAuthenticated for false, ProtectedRoute redireciona para /login
  // Se isLoading for false e isAuthenticated for true, ProtectedRoute renderiza children
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

