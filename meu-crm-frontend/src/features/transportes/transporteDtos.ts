// src/features/transportes/transporteDtos.ts
export interface CreateTransporteDTO {
  clienteId: number;
  numeroCteOc: string;
  dataOperacao: string;         // ISO date string
  valorTotal: number;
  placaVeiculo?: string;        // Campo adicionado
  fatura?: string;              // Campo adicionado
  valorFrete?: number;          // Campo adicionado
  observacoes?: string;         // Campo adicionado
  dataColeta?: string;          // Campo adicionado
  // dataEntregaPrevista removido
  dataEnvioFaturamento?: string;
  dataVencimento?: string;
  dataAtesto?: string;
  dataNotaFiscal?: string;
  descricaoNotaFiscal?: string;
  status?: string;              // Campo adicionado
}

export interface UpdateTransporteDTO {
  numeroCteOc?: string;
  dataOperacao?: string;
  valorTotal?: number;
  placaVeiculo?: string;        // Campo adicionado
  fatura?: string;              // Campo adicionado
  valorFrete?: number;          // Campo adicionado
  observacoes?: string;         // Campo adicionado
  dataColeta?: string;          // Campo adicionado
  // dataEntregaPrevista removido
  dataEnvioFaturamento?: string;
  dataVencimento?: string;
  dataAtesto?: string;
  dataNotaFiscal?: string;
  descricaoNotaFiscal?: string;
  status?: string;              // Campo adicionado
}

export interface TransporteFilters {
  clienteId?: number;
  search?: string;              // busca em numeroCteOc ou descricao
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TransporteDTO {
  id: number;
  clienteId: number;
  numeroCteOc: string;
  dataOperacao: string;
  valorTotal: number;
  placaVeiculo?: string;        // Campo adicionado
  fatura?: string;              // Campo adicionado
  valorFrete?: number;          // Campo adicionado
  observacoes?: string;         // Campo adicionado
  dataColeta?: string;          // Campo adicionado
  // dataEntregaPrevista removido
  dataEnvioFaturamento?: string;
  dataVencimento?: string;
  dataAtesto?: string;
  dataNotaFiscal?: string;
  descricaoNotaFiscal?: string;
  status?: string;              // Campo adicionado
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: number;
    nome: string;
    cnpjCpf?: string;
    tipo: string;
  };
}
