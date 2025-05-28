// src/dtos/clienteDtos.ts

export interface CreateClienteDTO {
  nome: string;
  cnpjCpf: string;
  tipo: 'PJ' | 'PF';
  email?: string;
  telefone?: string;
  endereco?: string;
}

export interface UpdateClienteDTO {
  nome?: string;
  cnpjCpf?: string;
  tipo?: 'PJ' | 'PF';
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
}

export interface ClienteDTO {
  id: number;
  nome: string;
  cnpjCpf: string;
  tipo: 'PJ' | 'PF';
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClienteFilters {
  nome?: string;
  tipo?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}