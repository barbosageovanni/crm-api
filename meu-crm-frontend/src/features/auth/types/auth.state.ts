// src/features/auth/types/auth.state.ts
import type { LoginUserDTO, RegisterApiPayload } from './auth.api'; // DTOs da API
import type { UserProfileDTO } from './auth.api'; // Perfil do usuário
import type { ChangePasswordDTO } from './auth.api'; // Assumindo que este DTO existe
import { User } from './auth.enums';

// Interface para o estado do formulário de registro (inclui campos extras de UI)
export interface RegisterFormData extends RegisterApiPayload {
  confirmaSenha: string;
}

// Interface para o estado do formulário de mudança de senha
export interface ChangePasswordFormData extends ChangePasswordDTO {
  confirmaNovaSenha: string;
}


// Descreve o estado de autenticação guardado no AuthContext
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Para o carregamento inicial da autenticação
  error: string | null;
}

// Descreve todos os valores e métodos que o AuthContext fornecerá
export interface AuthContextType {
  // Estado
  user: UserProfileDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Métodos
  login: (credentials: LoginUserDTO) => Promise<void>;
  register: (userData: RegisterApiPayload) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (passwords: ChangePasswordDTO) => Promise<void>;
  verifyToken: () => Promise<boolean>;
  clearError: () => void;
  
  // Utilitários
  getCurrentUser: () => UserProfileDTO | null;
  getCurrentToken: () => string | null;
}