// src/features/clients/clienteDtos.ts

// Enum para o tipo de cliente (deve corresponder ao backend/Prisma)
export const TipoClienteEnum = {
  PF: 'PF', // Pessoa Física
  PJ: 'PJ'  // Pessoa Jurídica
} as const;

export type TipoCliente = typeof TipoClienteEnum[keyof typeof TipoClienteEnum];

// DTO para os dados do Cliente
export interface ClienteDTO {
  id?: number; // Prisma usa Int, então number aqui
  nome: string;
  cnpjCpf?: string | null; // Opcional e pode ser null
  tipo: TipoCliente; // Obrigatório
  email?: string | null; // Opcional e pode ser null
  telefone?: string | null; // Opcional e pode ser null
  endereco?: string | null; // Opcional e pode ser null
  ativo?: boolean; // Gerenciado pelo backend
  createdAt?: string; // Gerenciado pelo backend (string ISO)
  updatedAt?: string; // Gerenciado pelo backend (string ISO)
}

// DTO para criação (omitindo campos gerenciados pelo backend)
export type CreateClienteDTO = Omit<ClienteDTO, 'id' | 'ativo' | 'createdAt' | 'updatedAt'>;

// DTO para atualização (todos os campos, exceto ID e timestamps, são opcionais)
export type UpdateClienteDTO = Partial<Omit<ClienteDTO, 'id' | 'createdAt' | 'updatedAt'>>;

