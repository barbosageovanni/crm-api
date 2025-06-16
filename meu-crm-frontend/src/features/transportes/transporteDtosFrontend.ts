// src/features/transportes/transporteDtosFrontend.ts
export interface CreateTransporteDTO {
  clienteId: number;
  numeroCteOc: string;
  dataOperacao: string;         // ISO date string
  valorTotal: number;
  placaVeiculo?: string;        // Campo adicionado
  fatura?: string;              // Campo adicionado
  valorFrete?: number;
  observacoes?: string;
  dataColeta?: string;
  // dataEntregaPrevista removido
  dataEnvioFaturamento?: string;
  dataVencimento?: string;
  dataAtesto?: string;
  dataNotaFiscal?: string;
  descricaoNotaFiscal?: string;
  status?: string;
}

export interface UpdateTransporteDTO {
  numeroCteOc?: string;
  dataOperacao?: string;
  valorTotal?: number;
  placaVeiculo?: string;        // Campo adicionado
  fatura?: string;              // Campo adicionado
  valorFrete?: number;
  observacoes?: string;
  dataColeta?: string;
  // dataEntregaPrevista removido
  dataEnvioFaturamento?: string;
  dataVencimento?: string;
  dataAtesto?: string;
  dataNotaFiscal?: string;
  descricaoNotaFiscal?: string;
  status?: string;
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
  valorFrete?: number;
  observacoes?: string;
  dataColeta?: string;
  // dataEntregaPrevista removido
  dataEnvioFaturamento?: string;
  dataVencimento?: string;
  dataAtesto?: string;
  dataNotaFiscal?: string;
  descricaoNotaFiscal?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: number;
    nome: string;
    cnpjCpf?: string;
    tipo: string;
  };
}
