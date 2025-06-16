// src/dtos/userDtos.ts - VERSÃO CORRIGIDA E CONSISTENTE

// REVISÃO: A fonte da verdade para PapelUsuario deve ser o enum gerado pelo Prisma.
// Isso evita inconsistências entre o que a aplicação acha que existe e o que o banco de dados impõe.
import { PapelUsuario } from '@prisma/client';

// REVISÃO: Exportamos o tipo diretamente do Prisma para ser usado em toda a aplicação.
export { PapelUsuario };

// DTOs para usuários
export interface UserDTO {
  id: number;
  nome: string;
  email: string;
  papel: PapelUsuario; // Usa o tipo importado
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  nome: string;
  email: string;
  senha: string;
  papel?: PapelUsuario; // Opcional, o serviço pode definir um padrão
  ativo?: boolean;     // Opcional, o serviço pode definir um padrão
}

export interface UpdateUserDTO {
  nome?: string;
  email?: string;
  papel?: PapelUsuario;
  ativo?: boolean;
}

export interface ResetPasswordDTO {
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
  items: UserDTO[]; // REVISÃO: Tipagem forte em vez de 'any[]'
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}