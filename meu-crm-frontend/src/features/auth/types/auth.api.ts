// src/features/auth/types/auth.api.ts

// Importa o tipo PapelUsuario do arquivo de enums para manter a organização
import type { PapelUsuario } from './auth.enums';

/**
 * DTO para o corpo da requisição de login que o frontend envia para a API.
 */
// DTO para login
export interface LoginUserDTO {
  email: string;
  senha: string;
}
/**
 * DTO para os dados que são enviados para a API de registro.
 */
export interface RegisterApiPayload {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
}

/**
 * DTO que representa o perfil de um usuário como ele é retornado pela API.
 */
export interface UserProfileDTO {
  id: number;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  createdAt: string; // API retorna datas como string (formato ISO)
  updatedAt: string;
}

/**
 * DTO para a resposta completa da API de autenticação (usado em login e registro).
 */
export interface AuthApiResponse {
  user: UserProfileDTO;
  token: string;
  message?: string; // Mensagem opcional de sucesso
}

// DTOs para outras chamadas de API (ex: atualizar perfil, mudar senha)
export interface UpdateProfileDTO {
  nome?: string;
  email?: string;
}

export interface ChangePasswordApiPayload {
  senhaAtual: string;
  novaSenha: string;
}
// Resposta esqueceu senha
export interface ForgotPasswordResponseDTO {
  message: string;
  success: boolean;
}
// DTO para esqueceu senha
export interface ForgotPasswordDTO {
  email: string;
}
// DTO para registro
export interface RegisterUserDTO {
  nome: string;
  email: string;
  senha: string;
  papel?: PapelUsuario;
  confirmaSenha?: string; // Apenas para validação frontend
}


// DTO para redefinir senha
export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// DTO para alterar senha
export interface ChangePasswordDTO {
  senhaAtual: string;
  novaSenha: string;
  confirmaNovaSenha: string;
}

// Interface para métodos de autenticação
export interface AuthMethods {
  login: (credentials: LoginUserDTO) => Promise<void>;
  register: (userData: RegisterUserDTO) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (passwords: ChangePasswordDTO) => Promise<void>;
  verifyToken: () => Promise<boolean>;
  clearError: () => void;
}


// Resposta de erro
export interface AuthError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}


// Tipos para validação
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}