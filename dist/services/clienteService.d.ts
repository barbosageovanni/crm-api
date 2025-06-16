import { Cliente } from '@prisma/client';
import { CreateClienteDTO, UpdateClienteDTO, ClienteFilters, PaginationOptions } from '../dtos/clienteDtos';
export declare const clienteService: {
    getAllClientes: (filters?: ClienteFilters, pagination?: PaginationOptions) => Promise<{
        data: Cliente[];
        pagination: any;
    }>;
    getClienteById: (id: number) => Promise<Cliente>;
    createCliente: (data: CreateClienteDTO) => Promise<Cliente>;
    updateCliente: (id: number, data: UpdateClienteDTO) => Promise<Cliente>;
    deleteCliente: (id: number) => Promise<void>;
};
//# sourceMappingURL=clienteService.d.ts.map