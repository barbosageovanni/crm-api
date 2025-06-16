import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import authService from '../features/auth/authService';
import type { 
  LoginUserDTO, 
  RegisterUserDTO, 
  ChangePasswordDTO,
  UserProfileDTO,
} from '@/features/auth/types/auth.api';
import type {
  AuthContextType, 
  AuthState, 
} from '@/features/auth/types/auth.state';
import type {
  User 
} from '@/features/auth/types/auth.enums';

// Estados iniciais
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Tipos de ações do reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// Reducer de autenticação
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
};

// Contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

// Função auxiliar para converter UserProfileDTO para User
const convertUserProfileToUser = (userProfile: UserProfileDTO): User => {
  // Mapeia papéis que não existem no User para papéis válidos
  const mapPapel = (papel: string): 'ADMIN' | 'GERENTE' | 'USUARIO' => {
    switch (papel) {
      case 'ADMIN':
        return 'ADMIN';
      case 'GERENTE':
        return 'GERENTE';
      case 'VENDEDOR':
        return 'USUARIO'; // Mapeia VENDEDOR para USUARIO
      case 'USUARIO':
        return 'USUARIO';
      default:
        return 'USUARIO'; // Valor padrão
    }
  };

  return {
    id: String(userProfile.id), // Converte number para string
    nome: userProfile.nome,
    email: userProfile.email,
    papel: mapPapel(userProfile.papel),
    ativo: userProfile.ativo,
    createdAt: userProfile.createdAt,
    updatedAt: userProfile.updatedAt,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verifica autenticação ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'AUTH_START' });

        const token = authService.getCurrentToken();
        const userProfile = authService.getCurrentUser();

        if (token && userProfile) {
          try {
            const isValid = await authService.verifyToken();
            
            if (isValid) {
              const user = convertUserProfileToUser(userProfile);
              dispatch({ 
                type: 'AUTH_SUCCESS', 
                payload: { user, token } 
              });
            } else {
              authService.logout();
              dispatch({ type: 'AUTH_LOGOUT' });
            }
          } catch (verifyError) {
            console.warn('Erro ao verificar token, fazendo logout:', verifyError);
            authService.logout();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        authService.logout();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Função de login
  const login = async (credentials: LoginUserDTO): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.login(credentials);
      const user = convertUserProfileToUser(response.user);
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { 
          user, 
          token: response.token 
        } 
      });
    } catch (error: any) {
      console.error('Erro no login (AuthContext):', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (error.response?.status === 401) {
        errorMessage = 'E-mail ou senha incorretos';
      } else if (error.response?.status === 429) {
        errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erro do servidor. Tente novamente mais tarde';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Função de registro
  const register = async (userData: RegisterUserDTO): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Garantir que o papel não seja undefined e converter para RegisterApiPayload
      const registerData: RegisterUserDTO & { papel: NonNullable<RegisterUserDTO['papel']> } = {
        ...userData,
        papel: userData.papel || 'USUARIO'
      };

      const response = await authService.register(registerData);
      const user = convertUserProfileToUser(response.user);
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { 
          user, 
          token: response.token 
        } 
      });
    } catch (error: any) {
      console.error('Erro no registro (AuthContext):', error);
      const errorMessage = error.message || 'Erro ao registrar usuário';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Função de logout
  const logout = (): void => {
    authService.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  // Função para resetar senha
  const resetPassword = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await authService.forgotPassword(email);
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      console.error('Erro no reset de senha (AuthContext):', error);
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (!error.message?.includes('Rota não encontrada')) {
        const errorMessage = error.message || 'Erro ao solicitar reset de senha';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      }
      
      throw error;
    }
  };

  // Função para alterar senha
  const changePassword = async (passwords: ChangePasswordDTO): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await authService.changePassword(passwords);
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const errorMessage = error.message || 'Erro ao alterar senha';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Função para verificar token
  const verifyToken = async (): Promise<boolean> => {
    try {
      const isValid = await authService.verifyToken();
      
      if (!isValid && state.isAuthenticated) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
      
      return isValid;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      if (state.isAuthenticated) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
      return false;
    }
  };

  // Função para limpar erro
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Função para obter usuário atual
  const getCurrentUser = (): UserProfileDTO | null => {
    if (state.user) {
      // Converte User de volta para UserProfileDTO
      return {
        id: Number(state.user.id),
        nome: state.user.nome,
        email: state.user.email,
        papel: state.user.papel || 'USUARIO',
        ativo: state.user.ativo ?? true,
        createdAt: state.user.createdAt || '',
        updatedAt: state.user.updatedAt || '',
      };
    }
    
    return authService.getCurrentUser();
  };

  // Função para obter token atual
  const getCurrentToken = (): string | null => {
    return state.token || authService.getCurrentToken();
  };

  // Valor do contexto
  const contextValue: AuthContextType = {
    // Estado
    user: state.user ? {
      id: Number(state.user.id),
      nome: state.user.nome,
      email: state.user.email,
      papel: state.user.papel || 'USUARIO',
      ativo: state.user.ativo ?? true,
      createdAt: state.user.createdAt || '',
      updatedAt: state.user.updatedAt || '',
    } : null,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Métodos
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    verifyToken,
    clearError,
    
    // Utilitários
    getCurrentUser,
    getCurrentToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

export default AuthContext;