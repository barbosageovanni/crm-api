// src/features/auth/types/auth.enums.ts

// Objeto para os valores do Papel do Usuário (deve corresponder ao enum do backend)
export const PapelUsuarioEnum = {
  ADMIN: 'ADMIN',
  USUARIO: 'USUARIO',
  VENDEDOR: 'VENDEDOR',
  GERENTE: 'GERENTE',
} as const;

// Tipo gerado a partir do objeto PapelUsuarioEnum.
// Garante que apenas os valores acima sejam aceitos.
export type PapelUsuario = typeof PapelUsuarioEnum[keyof typeof PapelUsuarioEnum];


// Interface do usuário (unificada)
export interface User {
  id: string;
  nome: string;
  email: string;
  papel: 'ADMIN' | 'GERENTE' | 'USUARIO';
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// DTO para os dados que são enviados para a API de registro (sem confirmaSenha)
export interface RegisterApiPayload {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
}

// DTO do perfil do usuário
export interface UserProfileDTO extends User {
  // Herda tudo de User, pode adicionar campos específicos se necessário
}
// DTO para atualização de perfil
export interface UpdateProfileDTO {
  nome?: string;
  email?: string;
  papel?: PapelUsuario;
  ativo?: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Resposta de autenticação (unificada)
export interface AuthResponseDTO {
  success?: boolean;
  message?: string;
  token: string;
  user: UserProfileDTO;
  expiresIn?: number;
}