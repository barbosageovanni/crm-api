// src/dtos/clienteDtos.ts
import { $Enums } from '@prisma/client'; // Importe $Enums para usar os tipos dos enums

// Tipo Prisma para TipoCliente, para clareza
type PrismaTipoCliente = $Enums.TipoCliente;

export interface CreateClienteDTO {
  nome: string;
  tipo: PrismaTipoCliente; // Obrigatório na criação, usando o enum
  cnpjCpf?: string;         // Opcional, alinhado com schema.prisma (String?)
  email?: string;           // Opcional
  telefone?: string;        // Opcional
  endereco?: string;        // Opcional
  ativo?: boolean;          // Opcional, usará o default(true) do schema se não fornecido
}

export interface UpdateClienteDTO {
  nome?: string;
  cnpjCpf?: string;
  tipo?: PrismaTipoCliente;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
}

// CORREÇÃO: Adicionar '| undefined' explicitamente às propriedades opcionais
// devido a 'exactOptionalPropertyTypes: true' no tsconfig.json
export interface ClienteFilters {
  nome?: string;
  tipo?: PrismaTipoCliente;   // CORRIGIDO: Opcional e usa o tipo enum do Prisma//
  ativo?: boolean;
  search?: string;
  email?: string; // Adicione se for um filtro

}

export interface PaginationOptions {
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | undefined; // Idealmente, tipar com keyof Cliente para os campos permitidos
  sortOrder?: 'asc' | 'desc' | undefined;
}

// Interface duplicada removida. A definição acima é suficiente.

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

// Exemplo de DTO para resposta, se necessário
export interface ClienteResponseDTO {
  id: number;
  nome: string;
  tipo: PrismaTipoCliente;
  cnpjCpf: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
  createdAt: Date; // Prisma retorna Date
  updatedAt: Date; // Prisma retorna Date
}

export interface PaginatedClienteResponse {
  data: ClienteResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
