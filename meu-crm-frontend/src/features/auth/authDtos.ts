// Papel do usuário
export const PapelUsuarioEnum = {
  ADMIN: 'ADMIN',
  USUARIO: 'USUARIO',
  VENDEDOR: 'VENDEDOR',
  GERENTE: 'GERENTE'
} as const;

export type PapelUsuario = typeof PapelUsuarioEnum[keyof typeof PapelUsuarioEnum];

// DTO para login
export interface LoginUserDTO {
  email: string;
  senha: string;
}

// DTO para os dados que são enviados para a API de registro (sem confirmaSenha)
export interface RegisterApiPayload {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
}

// DTO para a resposta completa da API de autenticação
export interface AuthApiResponse {
  user: UserProfileDTO;
  token: string;
  message?: string;
}

// DTO para registro
export interface RegisterUserDTO {
  nome: string;
  email: string;
  senha: string;
  papel?: PapelUsuario;
  confirmaSenha?: string; // Apenas para validação frontend
}

// DTO para esqueceu senha
export interface ForgotPasswordDTO {
  email: string;
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

// Interface do usuário (unificada)
export interface User {
  id: string;
  nome: string;
  email: string;
  papel?: PapelUsuario;
  ativo?: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

// DTO do perfil do usuário
export interface UserProfileDTO extends User {
  // Herda tudo de User, pode adicionar campos específicos se necessário
}

// DTO para atualização de perfil
export interface UpdateProfileDTO {
 id: number;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  createdAt: string; // Datas como string (formato ISO)
  updatedAt: string;
}

// Resposta de autenticação (unificada)
export interface AuthResponseDTO {
  success?: boolean;
  message?: string;
  token: string;
  user: UserProfileDTO;
  expiresIn?: number;
}

// Resposta esqueceu senha
export interface ForgotPasswordResponseDTO {
  message: string;
  success: boolean;
}

// Resposta de erro
export interface AuthError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

// Context Auth State
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Context Interface
export interface AuthContextType {
  // Estado
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Métodos
  login: (credentials: LoginUserDTO) => Promise<void>;
  register: (userData: RegisterUserDTO) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (passwords: ChangePasswordDTO) => Promise<void>;
  verifyToken: () => Promise<boolean>;
  clearError: () => void;
  
  // Utilitários
  getCurrentUser: () => User | null;
  getCurrentToken: () => string | null;
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