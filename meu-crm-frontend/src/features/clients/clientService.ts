// src/features/clients/clientService.ts
import apiClient from '../../services/apiClient';

// Enum para tipo de cliente (sincronizado com backend)
export enum TipoCliente {
  PF = 'PF',
  PJ = 'PJ'
}

// DTOs para o frontend
export interface ClienteDTO {
  id: number;
  nome: string;
  tipo: TipoCliente;
  cnpjCpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClienteDTO {
  nome: string;
  tipo: TipoCliente;
  cnpjCpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
}

export interface UpdateClienteDTO {
  nome?: string;
  tipo?: TipoCliente;
  cnpjCpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
}

// Interface para resposta paginada
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

// Tipos para filtros
export interface ClienteFilters {
  nome?: string;
  tipo?: TipoCliente;
  ativo?: boolean;
  search?: string;
  email?: string;
}

const CLIENTES_ROUTE = "/clientes";

const clientService = {
  // Buscar clientes com paginação e filtros
  async getClientes(
    page: number = 1, 
    limit: number = 10,
    filters?: ClienteFilters
  ): Promise<PaginatedResponse<ClienteDTO>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Adiciona filtros se fornecidos
    if (filters?.nome) params.append('nome', filters.nome);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.ativo !== undefined) params.append('ativo', filters.ativo.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.email) params.append('email', filters.email);

    try {
      const response = await apiClient.get<PaginatedResponse<ClienteDTO>>(
        `${CLIENTES_ROUTE}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      throw error;
    }
  },

  // Buscar cliente por ID
  async getClienteById(id: number): Promise<ClienteDTO> {
    try {
      const response = await apiClient.get<ClienteDTO>(`${CLIENTES_ROUTE}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar cliente ${id}:`, error);
      throw error;
    }
  },

  // Criar novo cliente
  async createCliente(data: CreateClienteDTO): Promise<ClienteDTO> {
    try {
      const response = await apiClient.post<ClienteDTO>(CLIENTES_ROUTE, data);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      throw error;
    }
  },

  // Atualizar cliente
  async updateCliente(id: number, data: UpdateClienteDTO): Promise<ClienteDTO> {
    try {
      const response = await apiClient.put<ClienteDTO>(`${CLIENTES_ROUTE}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar cliente ${id}:`, error);
      throw error;
    }
  },

  // Deletar cliente
  async deleteCliente(id: number): Promise<void> {
    try {
      await apiClient.delete(`${CLIENTES_ROUTE}/${id}`);
    } catch (error) {
      console.error(`Erro ao deletar cliente ${id}:`, error);
      throw error;
    }
  },
};

export default clientService;