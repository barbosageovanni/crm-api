// Papéis de usuário (substitui enum para compatibilidade com 'erasableSyntaxOnly')
export const PapelUsuario = {
  ADMIN: "ADMIN",
  GERENTE: "GERENTE",
  USUARIO: "USUARIO"
} as const;

export type PapelUsuario = typeof PapelUsuario[keyof typeof PapelUsuario];

// DTOs para usuários
export interface UserDTO {
  id: number;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  nome: string;
  email: string;
  senha: string;
  papel: string; // ou PapelUsuario, se definido
  ativo: boolean;
}

export interface UpdateUserDTO {
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
}

export interface ResetPasswordDTO {
  userId: number;
  novaSenha: string;
}

// DTOs para paginação e filtros
export interface UserFilterParams {
  nome?: string;
  email?: string;
  papel?: PapelUsuario;
  ativo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserPaginatedResponse {
  items: any[]; // troque pelo tipo correto, ex: UserDTO[]
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}