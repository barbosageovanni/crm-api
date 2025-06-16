import { $Enums } from '@prisma/client';
type PrismaTipoCliente = $Enums.TipoCliente;
export interface CreateClienteDTO {
    nome: string;
    tipo: PrismaTipoCliente;
    cnpjCpf?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    ativo?: boolean;
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
export interface ClienteFilters {
    nome?: string;
    tipo?: PrismaTipoCliente;
    ativo?: boolean;
    search?: string;
    email?: string;
}
export interface PaginationOptions {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: 'asc' | 'desc' | undefined;
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
export interface ClienteResponseDTO {
    id: number;
    nome: string;
    tipo: PrismaTipoCliente;
    cnpjCpf: string | null;
    email: string | null;
    telefone: string | null;
    endereco: string | null;
    ativo: boolean;
    createdAt: Date;
    updatedAt: Date;
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
export {};
//# sourceMappingURL=clienteDtos.d.ts.map